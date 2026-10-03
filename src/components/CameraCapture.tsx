import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async (mode: 'environment' | 'user') => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('לא ניתן לגשת למצלמה. ודא כי ניתנה הרשאת מצלמה בדפדפן.');
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhoto(dataUrl);
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100">צילום דף מבחן מהמצלמה</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview */}
        <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
          {cameraError ? (
            <div className="p-6 text-center text-rose-400 max-w-md">
              <p className="font-medium mb-2">{cameraError}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="mt-3 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                נסה שוב
              </button>
            </div>
          ) : capturedPhoto ? (
            <img src={capturedPhoto} alt="Captured exam sheet" className="w-full h-full object-contain" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Document guide overlay */}
              <div className="absolute inset-8 border-2 border-dashed border-indigo-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <span className="bg-slate-900/80 text-indigo-300 text-xs px-2.5 py-1 rounded-md self-start border border-indigo-500/30">
                  כוון את דף המבחן למסגרת
                </span>
                <span className="bg-slate-900/80 text-slate-400 text-xs px-2.5 py-1 rounded-md self-end border border-slate-700">
                  ודא תאורה טובה וטקסט ברור
                </span>
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={toggleCameraFacing}
            disabled={!!capturedPhoto}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-lg text-sm flex items-center gap-2 transition"
            title="החלף מצלמה אחורית / קדמית"
          >
            <RotateCcw className="w-4 h-4" />
            <span>החלף מצלמה</span>
          </button>

          {capturedPhoto ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition"
              >
                צלם מחדש
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
              >
                <Check className="w-4 h-4" />
                השתמש בתמונה זו
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleTakeSnapshot}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
              <span>צלם עמוד</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-slate-400 hover:text-slate-200 text-sm"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
};
