import { useState, useRef, useCallback, useEffect } from 'react';
import { sound } from './SoundEngine';
import { useLanguage } from './i18n';

export interface PendingRecording {
  blob: Blob;
  duration: number;
  formattedDuration: string;
  gameId: string;
  url: string;
}

export interface UseVideoRecorderReturn {
  isRecording: boolean;
  duration: number;
  formattedDuration: string;
  startRecording: (canvas: HTMLCanvasElement | null, gameId: string) => boolean;
  stopRecording: () => void;
  toggleRecording: (canvas: HTMLCanvasElement | null, gameId: string) => void;
  notification: string | null;
  pendingRecording: PendingRecording | null;
  isConverting: boolean;
  downloadWebM: () => void;
  convertToMp4: () => Promise<void>;
  dismissExport: () => void;
}

export function useVideoRecorder(): UseVideoRecorderReturn {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [pendingRecording, setPendingRecording] = useState<PendingRecording | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const durationRef = useRef<number>(0);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const gameIdRef = useRef<string>('game');
  const notificationTimeoutRef = useRef<number | null>(null);

  const showNotification = useCallback((msg: string, timeoutMs: number = 3000) => {
    if (notificationTimeoutRef.current) {
      window.clearTimeout(notificationTimeoutRef.current);
    }
    setNotification(msg);
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, timeoutMs);
  }, []);

  const dismissExport = useCallback(() => {
    setPendingRecording((prev) => {
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
      }
      return null;
    });
  }, []);

  const downloadWebM = useCallback(() => {
    if (!pendingRecording) return;
    const a = document.createElement('a');
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    a.href = pendingRecording.url;
    a.download = `${pendingRecording.gameId}_9x16_${dateStr}.webm`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
    }, 500);

    showNotification(t('recorder.exported'));
    dismissExport();
  }, [pendingRecording, showNotification, t, dismissExport]);

  const convertToMp4 = useCallback(async () => {
    if (!pendingRecording) return;
    setIsConverting(true);
    showNotification(t('recorder.converting_mp4'), 15000);

    try {
      const response = await fetch('/api/convert-webm-to-mp4', {
        method: 'POST',
        headers: {
          'Content-Type': 'video/webm'
        },
        body: pendingRecording.blob
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const mp4Blob = await response.blob();
      const mp4Url = URL.createObjectURL(mp4Blob);

      const a = document.createElement('a');
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      a.href = mp4Url;
      a.download = `${pendingRecording.gameId}_9x16_${dateStr}.mp4`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(mp4Url);
      }, 500);

      showNotification(t('recorder.exported_mp4'));
      dismissExport();
    } catch (err) {
      console.error('Erreur conversion MP4:', err);
      showNotification(t('recorder.conversion_failed'), 4000);
      downloadWebM();
    } finally {
      setIsConverting(false);
    }
  }, [pendingRecording, showNotification, t, dismissExport, downloadWebM]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Erreur lors de l\'arrêt du MediaRecorder:', err);
      }
    }

    // Arrêter uniquement les tracks vidéo du flux canvas pour libérer la mémoire (sans tuer l'audio)
    if (activeStreamRef.current) {
      activeStreamRef.current.getVideoTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      activeStreamRef.current = null;
    }

    setIsRecording(false);
    setDuration(0);
  }, []);

  const startRecording = useCallback((canvas: HTMLCanvasElement | null, gameId: string): boolean => {
    if (!canvas) {
      showNotification(t('recorder.canvas_not_found'));
      return false;
    }

    // Fermer tout export en attente précédent
    dismissExport();

    // Réinitialiser tout enregistrement en cours
    stopRecording();
    gameIdRef.current = gameId;

    // Récupérer le flux vidéo du Canvas
    let canvasStream: MediaStream | null = null;
    try {
      if ((canvas as any).captureStream) {
        canvasStream = (canvas as any).captureStream(60);
      } else if ((canvas as any).mozCaptureStream) {
        canvasStream = (canvas as any).mozCaptureStream(60);
      }
    } catch (err) {
      console.error('Erreur canvas.captureStream:', err);
    }

    if (!canvasStream) {
      showNotification(t('recorder.not_supported'));
      return false;
    }

    // Initialiser et récupérer la piste audio procédurale
    sound.init();
    const audioTrack = sound.getAudioTrack();

    // Assembler les pistes
    const combinedTracks: MediaStreamTrack[] = [];
    const videoTracks = canvasStream.getVideoTracks();
    if (videoTracks.length > 0) {
      combinedTracks.push(videoTracks[0]);
    }
    if (audioTrack) {
      combinedTracks.push(audioTrack);
    }

    const stream = new MediaStream(combinedTracks);
    activeStreamRef.current = stream;

    // Format d'enregistrement direct : WebM (VP9/VP8/Opus) à 12 Mbps
    // (Évite totalement le bug d'écran noir des encodeurs MP4 instables de navigateur)
    const candidateMimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];

    let recorder: MediaRecorder | null = null;
    let chosenMime = '';

    for (const mime of candidateMimeTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
        try {
          const testRecorder = new MediaRecorder(stream, {
            mimeType: mime,
            videoBitsPerSecond: 12_000_000 // 12 Mbps pour Full HD 1080x1920 60fps ultra-net
          });
          recorder = testRecorder;
          chosenMime = mime;
          break;
        } catch {
          // Si échec avec ce codec, on tente le suivant
        }
      }
    }

    if (!recorder) {
      try {
        recorder = new MediaRecorder(stream, { videoBitsPerSecond: 12_000_000 });
        chosenMime = recorder.mimeType || '';
      } catch (err) {
        console.error('Erreur démarrage MediaRecorder:', err);
        showNotification(t('recorder.failed'));
        stopRecording();
        return false;
      }
    }

    try {
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const totalChunks = chunksRef.current;
        if (totalChunks.length === 0) return;

        const finalBlob = new Blob(totalChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(finalBlob);

        const recDuration = durationRef.current;
        const mins = Math.floor(recDuration / 60);
        const secs = recDuration % 60;
        const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        setPendingRecording({
          blob: finalBlob,
          duration: recDuration,
          formattedDuration: formatted,
          gameId: gameIdRef.current,
          url
        });
      };

      // Démarrer la capture avec des tranches régulières de 1s
      recorder.start(1000);
      setIsRecording(true);
      setDuration(0);
      durationRef.current = 0;

      // Timer pour le compteur
      timerRef.current = window.setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
      }, 1000);

      showNotification(t('recorder.started'), 2500);
      return true;
    } catch (err) {
      console.error('Erreur démarrage MediaRecorder:', err);
      showNotification(t('recorder.failed'));
      stopRecording();
      return false;
    }
  }, [stopRecording, showNotification, t, dismissExport]);

  const toggleRecording = useCallback((canvas: HTMLCanvasElement | null, gameId: string) => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(canvas, gameId);
    }
  }, [isRecording, startRecording, stopRecording]);

  // Nettoyage en cas de démontage du composant
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (notificationTimeoutRef.current) {
        window.clearTimeout(notificationTimeoutRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }
      if (activeStreamRef.current) {
        activeStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      }
      dismissExport();
    };
  }, [dismissExport]);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const formattedDuration = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    isRecording,
    duration,
    formattedDuration,
    startRecording,
    stopRecording,
    toggleRecording,
    notification,
    pendingRecording,
    isConverting,
    downloadWebM,
    convertToMp4,
    dismissExport
  };
}

