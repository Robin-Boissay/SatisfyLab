import { useState, useRef, useCallback, useEffect } from 'react';
import { sound } from './SoundEngine';
import { useLanguage } from './i18n';

export interface UseVideoRecorderReturn {
  isRecording: boolean;
  duration: number;
  formattedDuration: string;
  startRecording: (canvas: HTMLCanvasElement | null, gameId: string) => boolean;
  stopRecording: () => void;
  toggleRecording: (canvas: HTMLCanvasElement | null, gameId: string) => void;
  notification: string | null;
}

export function useVideoRecorder(): UseVideoRecorderReturn {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
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

    // Arrêter les tracks du flux canvas pour libérer la mémoire
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
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

    // Déterminer le meilleur codec disponible
    const candidateMimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4'
    ];

    let chosenMime = '';
    for (const mime of candidateMimeTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
        chosenMime = mime;
        break;
      }
    }

    try {
      const options: MediaRecorderOptions = {
        videoBitsPerSecond: 8_000_000 // 8 Mbps pour une qualité HD 720p verticale nette
      };
      if (chosenMime) {
        options.mimeType = chosenMime;
      }

      const recorder = new MediaRecorder(stream, options);
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

        const ext = (recorder.mimeType || chosenMime).includes('mp4') ? 'mp4' : 'webm';
        const finalBlob = new Blob(totalChunks, { type: recorder.mimeType || 'video/webm' });
        const url = URL.createObjectURL(finalBlob);

        const a = document.createElement('a');
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        a.href = url;
        a.download = `${gameIdRef.current}_9x16_${dateStr}.${ext}`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 300);

        showNotification(t('recorder.exported'));
      };

      // Démarrer la capture avec des tranches régulières de 1s
      recorder.start(1000);
      setIsRecording(true);
      setDuration(0);

      // Timer pour le compteur
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      showNotification(t('recorder.started'), 2500);
      return true;
    } catch (err) {
      console.error('Erreur démarrage MediaRecorder:', err);
      showNotification(t('recorder.failed'));
      stopRecording();
      return false;
    }
  }, [stopRecording, showNotification]);

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
        activeStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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
    notification
  };
}

