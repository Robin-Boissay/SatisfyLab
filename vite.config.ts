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
