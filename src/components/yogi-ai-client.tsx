'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { Keypoint } from '@/lib/pose-constants';
import { analyzePose } from '@/lib/pose-analyzer';
import { Loader, Video, VideoOff } from 'lucide-react';

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

type AppState = 'initial' | 'loading' | 'detecting' | 'error' | 'permission_denied';

type YogiAiClientProps = {
  selectedPose: string | null;
  onFeedbackChange: (feedback: string[]) => void;
};

export function YogiAiClient({ selectedPose, onFeedbackChange }: YogiAiClientProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);
  const [appState, setAppState] = useState<AppState>('initial');
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);

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
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          if (landmarkResults.landmarks && landmarkResults.landmarks.length > 0) {
            for (const landmarks of landmarkResults.landmarks) {
              drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS);
              drawingUtils.drawLandmarks(landmarks, {
                  radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1)
              });
            }
          }
      }

      if (landmarkResults.landmarks && landmarkResults.landmarks.length > 0) {
        const landmarks = landmarkResults.landmarks[0];
        const keypoints = landmarks.map((landmark, i) => ({
            x: landmark.x * VIDEO_WIDTH,
            y: landmark.y * VIDEO_HEIGHT,
            z: landmark.z,
            score: landmark.visibility ?? 0,
        }));

        if (selectedPose) {
          const newFeedback = analyzePose(keypoints as Keypoint[], selectedPose as any);
          onFeedbackChange(newFeedback);
        }
      } else {
        onFeedbackChange([]);
      }
    }
    animationFrameId.current = requestAnimationFrame(detectPoseLoop);
  }, [appState, selectedPose, poseLandmarker, onFeedbackChange]);

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
    <div className="container mx-auto p-4">
      <Card className="overflow-hidden">
          <CardHeader>
              <CardTitle>Real-time Pose Correction</CardTitle>
              <CardDescription>
                  {appState === 'detecting'
                      ? 'The AI is analyzing your pose.'
                      : 'Start your webcam to begin.'}
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="relative w-full aspect-video bg-secondary rounded-lg flex items-center justify-center">
              {appState === 'loading' && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50 text-white">
                      <Loader className="animate-spin h-8 w-8" />
                      <p className="font-medium">{loadingMessage}</p>
                  </div>
              )}
              {appState === 'error' && (
                  <Alert variant="destructive" className="w-auto">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
              )}
              {appState === 'permission_denied' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center rounded-lg">
                      <VideoOff className="h-12 w-12 mb-4"/>
                      <h3 className="text-lg font-bold">Camera Access Denied</h3>
                      <p className="text-sm">Please enable camera permissions in your browser settings and refresh the page.</p>
                  </div>
              )}
                <video
                  id="webcam"
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className={`absolute top-0 left-0 w-full h-full object-cover rounded-lg transform -scale-x-100 ${hasCameraPermission ? 'opacity-100' : 'opacity-0'}`}
                  width={VIDEO_WIDTH}
                  height={VIDEO_HEIGHT}
                />
                <canvas
                    id="pose-canvas"
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full transform -scale-x-100"
                    width={VIDEO_WIDTH}
                    height={VIDEO_HEIGHT}
                />
                  {!hasCameraPermission && appState !== 'permission_denied' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center rounded-lg">
                      <Video className="h-12 w-12 mb-4"/>
                      <h3 className="text-lg font-bold">Waiting for Webcam</h3>
                      <p className="text-sm">Please grant camera access to begin.</p>
                    </div>
                )}
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
