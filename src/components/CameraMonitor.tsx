import React, { useEffect, useRef, useState } from 'react';
import { CameraOff, Video, User, UserX, Users } from 'lucide-react';
import { YoloDetector } from '../utils/yolo_utils';

const detector = new YoloDetector();

// How long (ms) someone can be absent before a warning fires
const NO_PERSON_WARNING_MS = 10_000; // 10 seconds
// How long (ms) between repeated "no person" warnings
const NO_PERSON_REPEAT_MS = 30_000;  // 30 seconds

type PersonStatus = 'ok' | 'no_person' | 'multiple';

interface CameraMonitorProps {
    onViolation?: (msg: string) => void;
    onWarning?: (msg: string) => void;
    onStatusChange?: (status: 'loading' | 'active' | 'error' | 'denied') => void;
}

export const CameraMonitor: React.FC<CameraMonitorProps> = ({ onViolation, onWarning, onStatusChange }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'active' | 'error' | 'denied'>('loading');
    const [debugMsg, setDebugMsg] = useState<string>("Initializing...");
    const [personStatus, setPersonStatus] = useState<PersonStatus>('ok');

    useEffect(() => {
        if (onStatusChange) {
            onStatusChange(status);
        }
    }, [status, onStatusChange]);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let detectionInterval: any = null;

        const startCamera = async () => {
            setDebugMsg("Requesting camera...");
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    try {
                        await videoRef.current.play();
                    } catch (e) {}
                }
                
                setStatus('active');
                setDebugMsg("Camera online");
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

            let lastPersonDetectedTime = Date.now();
            let lastNoPeersonWarningTime = 0;
            // Track if "multiple" violation already fired this session
            let multipleViolationFired = false;

            detectionInterval = setInterval(async () => {
                if (!videoRef.current) return;

                const video = videoRef.current;
                if (video.videoWidth === 0) return;

                // Sync canvas resolution
                if (overlayRef.current && overlayRef.current.width !== video.videoWidth) {
                    overlayRef.current.width = video.videoWidth;
                    overlayRef.current.height = video.videoHeight;
                }

                try {
                    const items = await detector.runInference(video);
                    drawDetections(items);
                    setDebugMsg(`AI Local: ${items.length} terdeteksi`);

                    // ── 1. Cell Phone Detection ────────────────────────────────
                    const cellPhone = items.find(item =>
                        item.label === 'cell phone' && item.confidence > 0.8
                    );
                    if (cellPhone && onViolation) {
                        onViolation("Terdeteksi menggunakan HP!");
                    }

                    // ── 2. Person Count Detection ──────────────────────────────
                    const persons = items.filter(item =>
                        item.label === 'person' && item.confidence > 0.85
                    );
                    const personCount = persons.length;

                    if (personCount === 0) {
                        // No person in frame
                        const absenceDuration = Date.now() - lastPersonDetectedTime;
                        const timeSinceLastWarning = Date.now() - lastNoPeersonWarningTime;

                        setPersonStatus('no_person');

                        if (
                            absenceDuration > NO_PERSON_WARNING_MS &&
                            timeSinceLastWarning > NO_PERSON_REPEAT_MS &&
                            onWarning
                        ) {
                            onWarning("Tidak ada orang terdeteksi di depan kamera! Harap kembali ke posisi semula.");
                            lastNoPeersonWarningTime = Date.now();
                        }
                    } else if (personCount > 1) {
                        // Multiple persons detected
                        lastPersonDetectedTime = Date.now();
                        setPersonStatus('multiple');

                        if (!multipleViolationFired && onViolation) {
                            onViolation(`Terdeteksi ${personCount} orang di depan kamera! Hanya peserta ujian yang boleh ada.`);
                            multipleViolationFired = true;
                        }
                    } else {
                        // Exactly 1 person — all good
                        lastPersonDetectedTime = Date.now();
                        lastNoPeersonWarningTime = 0; // reset so next absence triggers quickly
                        multipleViolationFired = false;
                        setPersonStatus('ok');
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
            ctx.lineWidth = 3;
            ctx.font = 'bold 14px sans-serif';

            items.forEach(det => {
                let x1, y1, x2, y2, label, confidence;
                if (Array.isArray(det)) {
                    [x1, y1, x2, y2, label] = det;
                    confidence = 1;
                } else {
                    const box = det.box || [0, 0, 0, 0];
                    [x1, y1, x2, y2] = box;
                    label = det.label;
                    confidence = det.confidence ?? 1;
                }

                const width = x2 - x1;
                const height = y2 - y1;

                // Color by label type
                let color = '#00ff88';
                if (label === 'cell phone') color = '#ff4444';
                else if (label === 'person') color = '#00aaff';

                ctx.strokeStyle = color;
                ctx.fillStyle = color;
                ctx.strokeRect(x1, y1, width, height);

                // Draw label text (un-mirrored on mirrored canvas)
                const textY = y1 > 20 ? y1 - 5 : y1 + 20;
                ctx.save();
                ctx.translate(x1, textY);
                ctx.scale(-1, 1);
                const confPct = Math.round(confidence * 100);
                ctx.fillText(`${label} ${confPct}%`, 0, 0);
                ctx.restore();
            });
        };

        startCamera();

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (detectionInterval) clearInterval(detectionInterval);
        };
    }, [status]);

    // Status badge config
    const personBadge = {
        ok:         { icon: <User  size={10} />, label: 'Peserta OK',        cls: 'bg-emerald-600/80 text-white' },
        no_person:  { icon: <UserX size={10} />, label: 'Tidak Ada Orang',   cls: 'bg-amber-500/80  text-white animate-pulse' },
        multiple:   { icon: <Users size={10} />, label: 'Banyak Orang!',     cls: 'bg-red-600/80    text-white animate-pulse' },
    }[personStatus];

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

            <canvas
                ref={overlayRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ transform: 'scaleX(-1)' }}
            />

            {status === 'active' && (
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {/* Live badge */}
                    <div className="flex items-center gap-2 px-2 py-1 bg-red-600/80 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm animate-pulse">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        Live Monitoring
                    </div>

                    {/* Person status badge */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${personBadge.cls}`}>
                        {personBadge.icon}
                        {personBadge.label}
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
