import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

function ffmpegConvertPlugin(): Plugin {
  return {
    name: 'ffmpeg-convert-plugin',
    configureServer(server) {
      server.middlewares.use('/api/ffmpeg-status', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ available: true }));
      });

      server.middlewares.use('/api/generate-voice-clips', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const themeId = (data.themeId || 'custom').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
            const lang = (data.lang || 'fr').toString();
            const items: { key: string; text: string }[] = Array.isArray(data.items) ? data.items : [];

            if (!items.length) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Aucun texte fourni' }));
              return;
            }

            const outDir = path.join(process.cwd(), 'public', 'audio', 'voice', themeId);
            if (!fs.existsSync(outDir)) {
              fs.mkdirSync(outDir, { recursive: true });
            }

            const generated: string[] = [];

            for (const item of items) {
              const cleanKey = (item.key || '').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
              const text = (item.text || '').toString().trim();
              if (!cleanKey || !text) continue;

              const rawPath = path.join(os.tmpdir(), `tts_${Date.now()}_${cleanKey}.mp3`);
              const outPath = path.join(outDir, `${cleanKey}.mp3`);

              const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;
              const resp = await fetch(ttsUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              });

              if (!resp.ok) {
                throw new Error(`Échec Google TTS pour "${text}" (${resp.status} ${resp.statusText})`);
              }

              const arrayBuf = await resp.arrayBuffer();
              fs.writeFileSync(rawPath, Buffer.from(arrayBuf));

              // Découpage instantané du silence initial avec ffmpeg
              await new Promise<void>((resolve, reject) => {
                const ffmpeg = spawn('/usr/bin/ffmpeg', [
                  '-y',
                  '-i', rawPath,
                  '-af', 'silenceremove=start_periods=1:start_duration=0:start_threshold=-35dB',
                  outPath
                ]);

                ffmpeg.on('close', (code) => {
                  fs.unlink(rawPath, () => {});
                  if (code === 0 && fs.existsSync(outPath)) {
                    resolve();
                  } else {
                    reject(new Error(`FFmpeg trimming échoué code ${code}`));
                  }
                });

                ffmpeg.on('error', (err) => {
                  fs.unlink(rawPath, () => {});
                  reject(err);
                });
              });

              generated.push(cleanKey);
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              themeId,
              count: generated.length,
              clips: generated
            }));
          } catch (err: any) {
            console.error('Erreur API /api/generate-voice-clips:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message || 'Erreur interne' }));
          }
        });
      });

      server.middlewares.use('/api/convert-webm-to-mp4', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        const tempId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const inputPath = path.join(os.tmpdir(), `${tempId}.webm`);
        const outputPath = path.join(os.tmpdir(), `${tempId}.mp4`);

        const writeStream = fs.createWriteStream(inputPath);
        req.pipe(writeStream);

        writeStream.on('finish', () => {
          const ffmpeg = spawn('/usr/bin/ffmpeg', [
            '-y',
            '-i', inputPath,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-preset', 'veryfast',
            '-crf', '18',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-movflags', '+faststart',
            outputPath
          ]);

          ffmpeg.on('close', (code) => {
            fs.unlink(inputPath, () => {});

            if (code === 0 && fs.existsSync(outputPath)) {
              res.setHeader('Content-Type', 'video/mp4');
              res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
              const stat = fs.statSync(outputPath);
              res.setHeader('Content-Length', stat.size);

              const readStream = fs.createReadStream(outputPath);
              readStream.pipe(res);
              readStream.on('close', () => {
                fs.unlink(outputPath, () => {});
              });
            } else {
              res.statusCode = 500;
              res.end('Conversion FFmpeg échouée');
              fs.unlink(outputPath, () => {});
            }
          });

          ffmpeg.on('error', (err) => {
            console.error('Erreur spawn FFmpeg:', err);
            res.statusCode = 500;
            res.end(err.message);
            fs.unlink(inputPath, () => {});
            fs.unlink(outputPath, () => {});
          });
        });

        writeStream.on('error', (err) => {
          console.error('Erreur écriture temporaire:', err);
          res.statusCode = 500;
          res.end(err.message);
          fs.unlink(inputPath, () => {});
        });
      });

      // --- NOUVEAU : PIPELINE RENDU HORS-LIGNE 60 FPS DÉTERMINISTE SANS AUCUNE SACCADE ---
      interface RenderSession {
        ffmpeg: any;
        rawVideoPath: string;
        audioPath: string;
        finalVideoPath: string;
        closePromise: Promise<number>;
        createdAt: number;
      }
      const activeSessions = new Map<string, RenderSession>();

      // Nettoyage régulier des sessions expirées (> 15 min)
      setInterval(() => {
        const now = Date.now();
        for (const [id, sess] of activeSessions.entries()) {
          if (now - sess.createdAt > 15 * 60 * 1000) {
            try { sess.ffmpeg.stdin.end(); sess.ffmpeg.kill(); } catch (_) {}
            fs.unlink(sess.rawVideoPath, () => {});
            fs.unlink(sess.audioPath, () => {});
            fs.unlink(sess.finalVideoPath, () => {});
            activeSessions.delete(id);
          }
        }
      }, 60000);

      // 1. Démarrer une session de rendu hors-ligne
      server.middlewares.use('/api/offline-render/start', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}');
            const sessionId = (data.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`).replace(/[^a-zA-Z0-9_-]/g, '_');
            const fps = data.fps || 60;

            const tempDir = os.tmpdir();
            const rawVideoPath = path.join(tempDir, `${sessionId}_raw.mp4`);
            const audioPath = path.join(tempDir, `${sessionId}_audio.wav`);
            const finalVideoPath = path.join(tempDir, `${sessionId}_final.mp4`);

            const ffmpeg = spawn('/usr/bin/ffmpeg', [
              '-y',
              '-threads', '0',
              '-f', 'image2pipe',
              '-vcodec', 'mjpeg',
              '-framerate', `${fps}`,
              '-i', 'pipe:0',
              '-c:v', 'libx264',
              '-pix_fmt', 'yuv420p',
              '-preset', 'ultrafast',
              '-crf', '18',
              '-movflags', '+faststart',
              rawVideoPath
            ]);

            const closePromise = new Promise<number>((resolve) => {
              ffmpeg.on('close', (code) => resolve(code ?? 0));
              ffmpeg.on('error', (err) => {
                console.error('Erreur spawn FFmpeg offline:', err);
                resolve(1);
              });
            });

            activeSessions.set(sessionId, {
              ffmpeg,
              rawVideoPath,
              audioPath,
              finalVideoPath,
              closePromise,
              createdAt: Date.now()
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, sessionId }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });

      // 2. Transmettre un lot d'images brutes JPEG directement dans stdin de FFmpeg
      server.middlewares.use('/api/offline-render/chunk', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        const urlObj = new URL(req.url || '', 'http://localhost');
        const sessionId = urlObj.searchParams.get('sessionId') || '';
        const session = activeSessions.get(sessionId);

        if (!session) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Session introuvable' }));
          return;
        }

        req.on('data', (chunk) => {
          session.ffmpeg.stdin.write(chunk);
        });

        req.on('end', () => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        });

        req.on('error', (err) => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message }));
        });
      });

      // 3. Finaliser l'encodage vidéo, recevoir l'audio WAV et muxer le MP4 final 60 FPS
      server.middlewares.use('/api/offline-render/finish', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        const urlObj = new URL(req.url || '', 'http://localhost');
        const sessionId = urlObj.searchParams.get('sessionId') || '';
        const session = activeSessions.get(sessionId);

        if (!session) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Session introuvable' }));
          return;
        }

        const audioWriteStream = fs.createWriteStream(session.audioPath);
        req.pipe(audioWriteStream);

        audioWriteStream.on('finish', async () => {
          try {
            // Ferme le flux d'entrée vidéo pour que FFmpeg termine l'encodage MP4
            session.ffmpeg.stdin.end();
            const videoCode = await session.closePromise;

            if (videoCode !== 0 || !fs.existsSync(session.rawVideoPath)) {
              throw new Error(`FFmpeg video encode failed with code ${videoCode}`);
            }

            const hasAudio = fs.existsSync(session.audioPath) && fs.statSync(session.audioPath).size > 100;
            let fileToSend = session.rawVideoPath;

            if (hasAudio) {
              // Muxage audio/vidéo ultra-rapide (copie vidéo sans ré-encodage, audio en AAC)
              await new Promise<void>((resolve, reject) => {
                const muxer = spawn('/usr/bin/ffmpeg', [
                  '-y',
                  '-i', session.rawVideoPath,
                  '-i', session.audioPath,
                  '-c:v', 'copy',
                  '-c:a', 'aac',
                  '-b:a', '192k',
                  '-movflags', '+faststart',
                  session.finalVideoPath
                ]);

                muxer.on('close', (code) => {
                  if (code === 0 && fs.existsSync(session.finalVideoPath)) {
                    fileToSend = session.finalVideoPath;
                    resolve();
                  } else {
                    reject(new Error(`Muxing failed with code ${code}`));
                  }
                });

                muxer.on('error', reject);
              });
            }

            const stat = fs.statSync(fileToSend);
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', 'attachment; filename="satisfylab_60fps_perfect.mp4"');
            res.setHeader('Content-Length', stat.size);

            const readStream = fs.createReadStream(fileToSend);
            readStream.pipe(res);

            readStream.on('close', () => {
              fs.unlink(session.rawVideoPath, () => {});
              fs.unlink(session.audioPath, () => {});
              fs.unlink(session.finalVideoPath, () => {});
              activeSessions.delete(sessionId);
            });
          } catch (err: any) {
            console.error('Erreur finale offline-render:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
            fs.unlink(session.rawVideoPath, () => {});
            fs.unlink(session.audioPath, () => {});
            fs.unlink(session.finalVideoPath, () => {});
            activeSessions.delete(sessionId);
          }
        });

        audioWriteStream.on('error', (err) => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message }));
        });
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), ffmpegConvertPlugin()],
  server: {
    port: 3000,
    open: true
  }
});
