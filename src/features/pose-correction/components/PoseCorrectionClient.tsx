'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { Keypoint, CustomPoseConfig } from '@/lib/pose-constants';
import { analyzePose } from '@/features/pose-correction/lib/pose-analyzer';
import { getAudioFeedback } from '@/app/actions';
import { Loader, Video, VideoOff, Info, X } from 'lucide-react';

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

type AppState = 'initial' | 'loading' | 'detecting' | 'error' | 'permission_denied';

export type PoseCorrectionClientProps = {
  selectedPose: string | null;
  poseConfig?: CustomPoseConfig;
  onFeedbackChange: (feedback: string[]) => void;
  onAccuracyChange: (accuracy: number) => void;
  photoDataUri?: string;
};

export function PoseCorrectionClient({ selectedPose, poseConfig, onFeedbackChange, onAccuracyChange }: PoseCorrectionClientProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);
  const audioQueueRef = useRef<string[]>([]);
  const isAudioPlaying = useRef(false);

  const [appState, setAppState] = useState<AppState>('initial');
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [showProTip, setShowProTip] = useState(true);

  const initApp = useCallback(async () => {
    setAppState('loading');
    setLoadingMessage('Loading AI model...');
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      const newPoseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1
      });
      setPoseLandmarker(newPoseLandmarker);
      setLoadingMessage('AI Model Loaded.');
      setAppState('detecting');
    } catch (error) {
      console.error('Error loading PoseLandmarker model:', error);
      setErrorMessage('Failed to load the AI model. Please refresh the page.');
      setAppState('error');
    }
  }, []);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT }
        });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
            videoRef.current?.play();
            initApp();
          });
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setAppState('permission_denied');
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
  }, [initApp, toast]);


  const playNextInQueue = useCallback(() => {
    if (audioQueueRef.current.length > 0) {
      const audioDataUri = audioQueueRef.current.shift();
      if(audioDataUri){
        const audio = new Audio(audioDataUri);
        audio.play().catch(e => console.error("Audio playback failed", e));
        audio.onended = () => {
            if(audioQueueRef.current.length === 0){
                isAudioPlaying.current = false;
            } else {
                playNextInQueue();
            }
        };
      }
    } else {
        isAudioPlaying.current = false;
    }
  }, []);

  const handleAudioFeedback = useCallback(async (text: string) => {
    try {
        const result = await getAudioFeedback({ feedbackText: text });
        if (result.success && result.audioDataUri) {
            audioQueueRef.current.push(result.audioDataUri);
            if(!isAudioPlaying.current){
                isAudioPlaying.current = true;
                playNextInQueue();
            }
        } else {
            console.error("Failed to get audio feedback:", result.error);
        }
    } catch(e) {
        console.error("Error in getAudioFeedback action", e);
    }
  }, [playNextInQueue]);


  const detectPoseLoop = useCallback(() => {
    if (appState !== 'detecting' || !poseLandmarker || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    if (video.readyState < 2) {
      animationFrameId.current = requestAnimationFrame(detectPoseLoop);
      return;
    }

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      const startTimeMs = performance.now();
      const landmarkResults = poseLandmarker.detectForVideo(video, startTimeMs);

      const canvasCtx = canvasRef.current.getContext('2d');
      if (canvasCtx) {
          const drawingUtils = new DrawingUtils(canvasCtx);
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          if (landmarkResults.landmarks && landmarkResults.landmarks.length > 0) {
            for (const landmarks of landmarkResults.landmarks) {
              drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: '#00FFFF', lineWidth: 2 });
              drawingUtils.drawLandmarks(landmarks, {
                  color: '#00FFFF',
                  fillColor: '#FFFFFF',
                  lineWidth: 1,
                  radius: 3,
              });
            }
          }
          canvasCtx.restore();
      }

      if (landmarkResults.landmarks && landmarkResults.landmarks.length > 0) {
        const landmarks = landmarkResults.landmarks[0];
        const keypoints = landmarks.map((landmark, i) => ({
            x: landmark.x * VIDEO_WIDTH,
            y: landmark.y * VIDEO_HEIGHT,
            z: landmark.z,
            score: landmark.visibility ?? 0,
        }));


        if (selectedPose && poseConfig) {
          const { feedback: newFeedback, accuracy } = analyzePose(keypoints as Keypoint[], poseConfig);
          onFeedbackChange(newFeedback);
          onAccuracyChange(accuracy);

          const isAllGood = newFeedback.every(f => f.includes('good') || f.includes('perfect'));
            if (!isAllGood) {
              newFeedback.forEach(f => {
                  // Only provide audio for actionable feedback, not for "good" or "analyzing" messages.
                  if(!f.includes('good') && !f.includes('perfect') && !f.includes('Analyzing')) {
                      handleAudioFeedback(f);
                  }
              });
            }

        }
      } else {
        if (typeof onFeedbackChange === 'function') {
          onFeedbackChange([]);
        }
        if (typeof onAccuracyChange === 'function') {
            onAccuracyChange(0);
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(detectPoseLoop);
  }, [appState, selectedPose, poseConfig, poseLandmarker, onFeedbackChange, onAccuracyChange, handleAudioFeedback]);

  useEffect(() => {
    if (appState === 'detecting') {
      animationFrameId.current = requestAnimationFrame(detectPoseLoop);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [appState, detectPoseLoop]);


  return (
    <div className="overflow-hidden w-full h-full flex flex-col">
        {showProTip && (
            <Alert className="m-4 relative pr-10">
                <Info className="h-4 w-4" />
                <AlertTitle>Pro Tip</AlertTitle>
                <AlertDescription>
                    For best results, position yourself 6-8 feet (2-2.5 meters) away, ensuring your entire body is visible.
                </AlertDescription>
                <button onClick={() => setShowProTip(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Dismiss</span>
                </button>
            </Alert>
        )}
        <div className="relative w-full aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden m-4 mt-0">
        {appState === 'loading' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
                <Loader className="animate-spin h-8 w-8" />
                <p>{loadingMessage}</p>
            </div>
        )}
        {appState === 'error' && (
            <Alert variant="destructive" className="w-auto z-20">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
        )}
        {appState === 'permission_denied' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-4 text-center rounded-lg">
                <VideoOff className="h-12 w-12 mb-4 text-destructive"/>
                <h3 className="text-lg font-bold">Camera Access Denied</h3>
                <p>Please enable camera permissions in your browser settings and refresh the page.</p>
            </div>
        )}
          <video
            id="webcam"
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className={`absolute top-0 left-0 w-full h-full object-cover rounded-lg ${hasCameraPermission ? 'opacity-100' : 'opacity-0'}`}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
          />
          <canvas
              id="pose-canvas"
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full z-10"
              width={VIDEO_WIDTH}
              height={VIDEO_HEIGHT}
          />
            {!hasCameraPermission && appState !== 'permission_denied' && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-4 text-center rounded-lg">
                <Video className="h-12 w-12 mb-4"/>
                <h3 className="text-lg font-bold">Waiting for Webcam</h3>
                <p>Please grant camera access to begin.</p>
              </div>
          )}
        </div>
    </div>
  );
}
