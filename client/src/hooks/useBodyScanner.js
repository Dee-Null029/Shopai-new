import { useRef, useState, useCallback, useEffect } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// MediaPipe Pose landmark indices
const LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
};

function distance3D(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

/**
 * Estimate body measurements from pose landmarks.
 * Uses the user's stated height as a reference to convert
 * normalized landmark distances into real-world centimeters.
 */
function calculateMeasurements(landmarks, referenceHeight = 170) {
  const lm = landmarks;

  // Full body height in landmark space: top of head (approximated) to feet
  const headTop = { x: lm[LANDMARKS.NOSE].x, y: lm[LANDMARKS.NOSE].y - 0.08, z: lm[LANDMARKS.NOSE].z };
  const leftFoot = lm[LANDMARKS.LEFT_HEEL];
  const rightFoot = lm[LANDMARKS.RIGHT_HEEL];
  const feetMid = midpoint(leftFoot, rightFoot);
  const bodyHeightPx = distance3D(headTop, feetMid);

  if (bodyHeightPx < 0.01) return null; // Invalid detection

  const pxToCm = referenceHeight / bodyHeightPx;

  // Shoulder width
  const shoulderWidth = distance3D(lm[LANDMARKS.LEFT_SHOULDER], lm[LANDMARKS.RIGHT_SHOULDER]) * pxToCm;

  // Chest circumference estimate: shoulder width × π × 0.65 (empirical ratio)
  const chest = shoulderWidth * Math.PI * 0.65;

  // Hip width
  const hipWidth = distance3D(lm[LANDMARKS.LEFT_HIP], lm[LANDMARKS.RIGHT_HIP]) * pxToCm;

  // Hip circumference estimate
  const hip = hipWidth * Math.PI * 0.8;

  // Waist estimate: average of shoulder and hip measurements, slightly smaller
  const waist = (chest + hip) / 2 * 0.85;

  // Body type classification
  const waistToHip = waist / hip;
  const shoulderToHip = shoulderWidth / hipWidth;
  let bodyType = 'average';
  if (waistToHip < 0.75) bodyType = 'slim';
  else if (shoulderToHip > 1.3) bodyType = 'athletic';
  else if (waistToHip > 0.9) bodyType = 'plus';

  return {
    height: Math.round(referenceHeight),
    chest: Math.round(Math.max(70, Math.min(130, chest))),
    waist: Math.round(Math.max(55, Math.min(120, waist))),
    hip: Math.round(Math.max(70, Math.min(130, hip))),
    shoulder: Math.round(Math.max(30, Math.min(60, shoulderWidth))),
    bodyType,
    confidence: 75,
  };
}

export default function useBodyScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animFrameRef = useRef(null);

  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLandmarks, setCurrentLandmarks] = useState(null);
  const [measurements, setMeasurements] = useState(null);
  const [referenceHeight, setReferenceHeight] = useState(170);

  // Initialize MediaPipe Pose Landmarker
  const initLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current;

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    const landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    landmarkerRef.current = landmarker;
    return landmarker;
  }, []);

  // Start camera and detection loop
  const startScanning = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const landmarker = await initLandmarker();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error('Video element not ready');
      video.srcObject = stream;
      await video.play();

      setIsScanning(true);
      setIsLoading(false);

      // Detection loop
      let lastTime = -1;
      const detect = () => {
        if (!videoRef.current || videoRef.current.paused) return;
        const now = performance.now();
        if (now === lastTime) {
          animFrameRef.current = requestAnimationFrame(detect);
          return;
        }
        lastTime = now;

        try {
          const result = landmarker.detectForVideo(videoRef.current, now);
          if (result.landmarks?.[0]) {
            setCurrentLandmarks(result.landmarks[0]);
            drawLandmarks(result.landmarks[0]);
          }
        } catch {
          // Skip frame on detection error
        }

        animFrameRef.current = requestAnimationFrame(detect);
      };

      animFrameRef.current = requestAnimationFrame(detect);
    } catch (err) {
      setIsLoading(false);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera.');
      } else {
        setError(`Failed to start scanner: ${err.message}`);
      }
    }
  }, [initLandmarker]);

  // Draw landmarks on overlay canvas
  const drawLandmarks = useCallback((landmarks) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections (skeleton)
    const connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
      [24, 26], [26, 28],
    ];

    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    for (const [i, j] of connections) {
      const a = landmarks[i];
      const b = landmarks[j];
      if (a.visibility > 0.5 && b.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
        ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
        ctx.stroke();
      }
    }

    // Draw key measurement points
    const keyPoints = [
      LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER,
      LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP,
      LANDMARKS.LEFT_ANKLE, LANDMARKS.RIGHT_ANKLE,
    ];

    for (const idx of keyPoints) {
      const lm = landmarks[idx];
      if (lm.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#f43f5e';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }, []);

  // Capture current frame measurements
  const captureMeasurements = useCallback(() => {
    if (!currentLandmarks) {
      setError('No body detected. Please stand in full view of the camera.');
      return null;
    }

    const result = calculateMeasurements(currentLandmarks, referenceHeight);
    if (!result) {
      setError('Could not calculate measurements. Please ensure your full body is visible.');
      return null;
    }

    setMeasurements(result);
    return result;
  }, [currentLandmarks, referenceHeight]);

  // Stop scanning and release resources
  const stopScanning = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setCurrentLandmarks(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [stopScanning]);

  return {
    videoRef,
    canvasRef,
    isScanning,
    isLoading,
    error,
    measurements,
    currentLandmarks,
    referenceHeight,
    setReferenceHeight,
    startScanning,
    stopScanning,
    captureMeasurements,
  };
}
