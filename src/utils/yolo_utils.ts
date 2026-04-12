import * as ort from 'onnxruntime-web';

// Configure WASM paths for reliability - Align with installed version 1.24.3
ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';

// Full COCO labels list for YOLOv8
export const COCO_LABELS = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
    'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
    'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
    'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
    'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
    'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

export class YoloDetector {
    private session: ort.InferenceSession | null = null;
    private modelWidth = 640;
    private modelHeight = 640;

    async loadModel(modelPath: string, onProgress?: (p: number) => void) {
        if (this.session) return;

        try {
            // 1. Manual download to track progress
            console.log("Downloading model...");
            const response = await fetch(modelPath);
            if (!response.ok) throw new Error(`Failed to fetch model: ${response.statusText}`);
            
            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            let loaded = 0;

            const reader = response.body?.getReader();
            if (!reader) throw new Error("Could not get reader for model download");

            const chunks = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                loaded += value.length;
                if (total && onProgress) {
                    onProgress(Math.round((loaded / total) * 100));
                }
            }

            const modelBuffer = new Uint8Array(loaded);
            let offset = 0;
            for (const chunk of chunks) {
                modelBuffer.set(chunk, offset);
                offset += chunk.length;
            }

            // 2. Initialize ONNX runtime with the buffer
            console.log("Initializing ONNX Runtime...");
            
            // Note: Some versions of ORT have issues with WebGL backend initialization in some environments.
            // We'll try to use WASM first as it's more reliable, especially for initial setup.
            this.session = await ort.InferenceSession.create(modelBuffer.buffer, {
                executionProviders: ['wasm'], // Prioritize WASM for broad compatibility
            });
            console.log("YOLO Model loaded successfully on WASM");
        } catch (e) {
            console.error("YOLO Load Error:", e);
            throw e;
        }
    }

    async runInference(videoElement: HTMLVideoElement): Promise<any[]> {
        if (!this.session) return [];

        const originalWidth = videoElement.videoWidth;
        const originalHeight = videoElement.videoHeight;
        if (originalWidth === 0) return [];

        // 1. Pre-process with Letterboxing (maintain aspect ratio)
        const canvas = document.createElement('canvas');
        canvas.width = this.modelWidth;
        canvas.height = this.modelHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return [];

        // Fill background with gray (common YOLO padding)
        ctx.fillStyle = '#777';
        ctx.fillRect(0, 0, this.modelWidth, this.modelHeight);

        const scale = Math.min(this.modelWidth / originalWidth, this.modelHeight / originalHeight);
        const xOffset = (this.modelWidth - originalWidth * scale) / 2;
        const yOffset = (this.modelHeight - originalHeight * scale) / 2;

        ctx.drawImage(
            videoElement, 
            xOffset, yOffset, 
            originalWidth * scale, originalHeight * scale
        );
        
        const imageData = ctx.getImageData(0, 0, this.modelWidth, this.modelHeight);
        
        // 2. Prepare Input Tensor (NCHW format)
        const input = this.preprocess(imageData);
        const tensor = new ort.Tensor('float32', input, [1, 3, this.modelWidth, this.modelHeight]);

        // 3. Run Session
        const feeds: Record<string, ort.Tensor> = {};
        feeds[this.session.inputNames[0]] = tensor;
        const results = await this.session.run(feeds);
        const output = results[this.session.outputNames[0]].data as Float32Array;

        // 4. Post-process (with padding awareness)
        return this.postprocess(output, originalWidth, originalHeight, scale, xOffset, yOffset);
    }

    private preprocess(imageData: ImageData): Float32Array {
        const { data, width, height } = imageData;
        const float32Data = new Float32Array(3 * width * height);

        // Normalize and convert to Planar (RGB separation)
        for (let i = 0; i < width * height; i++) {
            float32Data[i] = data[i * 4] / 255.0; // R
            float32Data[i + width * height] = data[i * 4 + 1] / 255.0; // G
            float32Data[i + 2 * width * height] = data[i * 4 + 2] / 255.0; // B
        }
        return float32Data;
    }

    private postprocess(
        output: Float32Array, 
        originalWidth: number, 
        originalHeight: number,
        scale: number,
        xOffset: number,
        yOffset: number
    ): any[] {
        const boxes: any[] = [];
        const threshold = 0.35; // Lowered slightly for better recall
        const numClasses = 80;
        const numRows = 8400; // YOLOv8 output size for 640x640

        for (let i = 0; i < numRows; i++) {
            let maxProb = 0;
            let classId = -1;

            for (let j = 0; j < numClasses; j++) {
                const prob = output[(numRows * (j + 4)) + i];
                if (prob > maxProb) {
                    maxProb = prob;
                    classId = j;
                }
            }

            if (maxProb > threshold) {
                // Get box coords (normalized to 640x640)
                const cx = output[i];
                const cy = output[numRows + i];
                const w = output[2 * numRows + i];
                const h = output[3 * numRows + i];

                // Remove padding and scale back to original coords, then clip to boundaries
                const x1 = Math.max(0, (cx - w / 2 - xOffset) / scale);
                const y1 = Math.max(0, (cy - h / 2 - yOffset) / scale);
                const x2 = Math.min(originalWidth, (cx + w / 2 - xOffset) / scale);
                const y2 = Math.min(originalHeight, (cy + h / 2 - yOffset) / scale);

                boxes.push({ box: [x1, y1, x2, y2], label: COCO_LABELS[classId], confidence: maxProb });
            }
        }

        return this.applyNMS(boxes);
    }

    private applyNMS(boxes: any[]): any[] {
        if (boxes.length === 0) return [];
        
        // Sort by confidence
        boxes.sort((a, b) => b.confidence - a.confidence);

        const results: any[] = [];
        const iouThreshold = 0.45;

        while (boxes.length > 0) {
            const best = boxes.shift()!;
            results.push(best);

            boxes = boxes.filter(box => {
                const iou = this.calculateIOU(best.box, box.box);
                return iou < iouThreshold;
            });
        }

        return results;
    }

    private calculateIOU(box1: number[], box2: number[]): number {
        const interX1 = Math.max(box1[0], box2[0]);
        const interY1 = Math.max(box1[1], box2[1]);
        const interX2 = Math.min(box1[2], box2[2]);
        const interY2 = Math.min(box1[3], box2[3]);
        
        const interWidth = Math.max(0, interX2 - interX1);
        const interHeight = Math.max(0, interY2 - interY1);
        const interArea = interWidth * interHeight;

        const area1 = (box1[2] - box1[0]) * (box1[3] - box1[1]);
        const area2 = (box2[2] - box2[0]) * (box2[3] - box2[1]);
        const unionArea = area1 + area2 - interArea;

        return unionArea > 0 ? interArea / unionArea : 0;
    }
}
