import React, { useEffect, useRef, useState } from 'react';
import { CameraOff, Video } from 'lucide-react';
import { YoloDetector } from '../utils/yolo_utils';

const detector = new YoloDetector();

interface CameraMonitorProps {
    onViolation?: (msg: string) => void;
}

export const CameraMonitor: React.FC<CameraMonitorProps> = ({ onViolation }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'active' | 'error' | 'denied'>('loading');
    const [debugMsg, setDebugMsg] = useState<string>("Initializing...");

    useEffect(() => {
        let stream: MediaStream | null = null;
        let detectionInterval: any = null;

        const startCamera = async () => {
            setDebugMsg("Requesting camera...");
            try {
                // Simplified constraints to avoid hanging
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: true 
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    try {
                        await videoRef.current.play();
                    } catch (e) {}
                }
                
                setStatus('active');
                setDebugMsg("Camera online");
                
                // Start detection loop
                startDetectionLoop();
            } catch (err) {
                console.error("Camera error:", err);
                setDebugMsg(`Camera Error: ${err instanceof Error ? err.message : String(err)}`);
                setStatus(err instanceof DOMException && err.name === 'NotAllowedError' ? 'denied' : 'error');
            }
        };

        const startDetectionLoop = async () => {
            setDebugMsg("Initializing AI...");
            try {
                await detector.loadModel('/yolov8n.onnx', (percent) => {
                    setDebugMsg(`Downloading AI Model: ${percent}%`);
                });
                
                setDebugMsg("AI Local (YOLOv8) Active");
            } catch (e) {
                console.error("Model load error:", e);
                setDebugMsg("AI Local Gagal Dimuat");
                return;
            }

            detectionInterval = setInterval(async () => {
                if (!videoRef.current || status !== 'active') return;

                const video = videoRef.current;
                if (video.videoWidth === 0) return;

                // Sync canvas resolution to video resolution
                if (overlayRef.current && (overlayRef.current.width !== video.videoWidth)) {
                    overlayRef.current.width = video.videoWidth;
                    overlayRef.current.height = video.videoHeight;
                }

                try {
                    const items = await detector.runInference(video);
                    drawDetections(items);
                    setDebugMsg(`AI Local: ${items.length} detected`);

                    // Check for Cell Phone detected with high confidence
                    const cellPhone = items.find(item => 
                        item.label === 'cell phone' && item.confidence > 0.8
                    );
                    
                    if (cellPhone && onViolation) {
                        onViolation("Terdeteksi menggunakan HP!");
                    }
                } catch (err) {
                    console.error("Inference error:", err);
                }
            }, 100);
        };

        const drawDetections = (items: any[]) => {
            const canvas = overlayRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 16px sans-serif';

            items.forEach(det => {
                let x1, y1, x2, y2, label;
                if (Array.isArray(det)) {
                    [x1, y1, x2, y2, label] = det;
                } else {
                    const box = det.box || [0, 0, 0, 0];
                    [x1, y1, x2, y2] = box;
                    label = det.label;
                }

                const width = x2 - x1;
                const height = y2 - y1;

                // Draw bounding box
                ctx.strokeRect(x1, y1, width, height);

                // Draw label - Handle mirroring
                // Since canvas is mirrored via CSS scaleX(-1), we need to flip the context
                // to make text readable, then flip back.
                ctx.save();
                // We are at (x1, y1). But because of CSS scaleX(-1) on canvas,
                // the horizontal coordinate x1 is actually at (width - x1) on screen.
                // However, fillText(label, x1, y1) works fine for position, but mirrors characters.
                
                // Correct way to draw un-mirrored text on a mirrored canvas:
                const textY = y1 > 20 ? y1 - 5 : y1 + 20;
                ctx.translate(x1, textY);
                ctx.scale(-1, 1); // Flip horizontally
                ctx.fillText(`${label}`, 0, 0);
                ctx.restore();
            });
        };

        startCamera();

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (detectionInterval) clearInterval(detectionInterval);
        };
    }, [status]);

    return (
        <div className="relative w-full h-full rounded-xl overflow-hidden bg-black/40 border border-white/5 flex flex-col items-center justify-center">
            {status === 'loading' && (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-xs text-gray-400 font-medium">Memulai Kamera...</span>
                    <span className="text-[10px] text-gray-500 font-mono italic">{debugMsg}</span>
                </div>
            )}

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${status === 'active' ? 'block' : 'hidden'}`}
                style={{ transform: 'scaleX(-1)' }} 
            />

            <canvas ref={overlayRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ transform: 'scaleX(-1)' }} />

            {status === 'active' && (
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 px-2 py-1 bg-red-600/80 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm animate-pulse">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        Live Monitoring
                    </div>
                </div>
            )}

            {(status === 'error' || status === 'denied') && (
                <div className="flex flex-col items-center gap-2 p-4 text-center z-10">
                    <CameraOff className={status === 'error' ? "text-gray-500" : "text-red-400"} size={32} />
                    <span className={`text-sm font-medium ${status === 'error' ? "text-gray-300" : "text-red-300"}`}>
                        {status === 'error' ? "Gagal Mengakses Kamera" : "Akses Kamera Ditolak"}
                    </span>
                    <span className="text-xs text-gray-500">{debugMsg}</span>
                </div>
            )}

            <div className="absolute bottom-3 right-3 opacity-30 z-10">
                <Video size={20} className="text-white" />
            </div>
        </div>
    );
};
