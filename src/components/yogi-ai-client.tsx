'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';

// TensorFlow and MediaPipe imports
import { FilesetResolver, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";

// App-specific imports
import { getAudioFeedback, getYogaPlan } from '@/app/actions';
import { POSES, PoseName, Keypoint } from '@/lib/pose-constants';
import { analyzePose } from '@/lib/pose-analyzer';
import { CheckCircle, Info, Loader, Video, VideoOff, Volume2 } from 'lucide-react';

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

type AppState = 'initial' | 'requesting_permission' | 'permission_denied' | 'webcam_active' | 'loading_model' | 'detecting' | 'error';


export function YogiAiClient() {
  const { toast } = useToast();
  // Refs for DOM elements and detection loop
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);
  const audioQueueRef = useRef<string[]>([]);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);

  // State management
  const [appState, setAppState] = useState<AppState>('initial');
  const [loadingMessage, setLoadingMessage] = useState('Loading AI Model...');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPose, setSelectedPose] = useState<PoseName | null>(null);
  const [feedbackList, setFeedbackList] = useState<string[]>([]);
  const [goal, setGoal] = useState<string>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string>('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);

  const initModel = useCallback(async () => {
    try {
      setAppState('loading_model');
      setLoadingMessage('Loading AI model...');
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

      if (canvasRef.current) {
        const canvasCtx = canvasRef.current.getContext('2d');
        if (canvasCtx) {
          drawingUtilsRef.current = new DrawingUtils(canvasCtx);
        }
      }

      setPoseLandmarker(newPoseLandmarker);
      setLoadingMessage('AI Model Loaded.');
      setAppState('detecting');
    } catch (error) {
      console.error('Error loading PoseLandmarker model:', error);
      setErrorMessage('Failed to load the AI model. Please refresh the page.');
      setAppState('error');
    }
  }, []);

  const startWebcam = useCallback(async () => {
    setAppState('requesting_permission');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not available on this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setAppState('webcam_active');
      initModel();

    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
      setAppState('permission_denied');
    }
  }, [toast, initModel]);

  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    setAppState('initial');
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setFeedbackList([]);
    setPoseLandmarker(null); // unload model
  }, []);

  const detectPoseLoop = useCallback(() => {
    if (appState !== 'detecting' || !poseLandmarker || !videoRef.current || !canvasRef.current || !drawingUtilsRef.current) {
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const drawingUtils = drawingUtilsRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      const startTimeMs = performance.now();
      const landmarkResults = poseLandmarker.detectForVideo(video, startTimeMs);
      
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (landmarkResults.landmarks && landmarkResults.landmarks.length > 0) {
        const landmarks = landmarkResults.landmarks[0];
        
        drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: '#00BFFF', lineWidth: 3 });
        drawingUtils.drawLandmarks(landmarks, { color: '#7B68EE', radius: 4 });

        const keypoints = landmarks.map((landmark, i) => ({
            x: landmark.x * VIDEO_WIDTH,
            y: landmark.y * VIDEO_HEIGHT,
            z: landmark.z,
            score: landmark.visibility ?? 0,
        }));
        
        if (selectedPose) {
          const newFeedback = analyzePose(keypoints as Keypoint[], selectedPose);
          setFeedbackList(currentFeedback => {
             if (JSON.stringify(currentFeedback) !== JSON.stringify(newFeedback)) {
                return newFeedback;
            }
            return currentFeedback;
          });
        }
      } else {
        setFeedbackList([]);
      }
      ctx.restore();
    }
    animationFrameId.current = requestAnimationFrame(detectPoseLoop);
  }, [appState, selectedPose, poseLandmarker]);

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
      // Make sure to stop the webcam when the component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
         (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [appState, detectPoseLoop]);

  const playNextInQueue = useCallback(() => {
    if (audioQueueRef.current.length > 0) {
      const audioDataUri = audioQueueRef.current.shift();
      if(audioDataUri){
        const audio = new Audio(audioDataUri);
        audio.play().catch(e => console.error("Audio playback failed", e));
        audio.onended = () => {
            if(audioQueueRef.current.length === 0){
                setIsAudioPlaying(false);
            } else {
                playNextInQueue();
            }
        };
      }
    } else {
        setIsAudioPlaying(false);
    }
  }, []);

  const handleAudioFeedback = useCallback(async (text: string) => {
    try {
        const result = await getAudioFeedback({ feedbackText: text });
        if (result.success && result.audioDataUri) {
            audioQueueRef.current.push(result.audioDataUri);
            if(!isAudioPlaying){
                setIsAudioPlaying(true);
                playNextInQueue();
            }
        } else {
            console.error("Failed to get audio feedback:", result.error);
        }
    } catch(e) {
        console.error("Error in getAudioFeedback action", e);
    }
  }, [isAudioPlaying, playNextInQueue]);

  useEffect(() => {
    if (feedbackList.length > 0 && selectedPose) {
        const timeoutId = setTimeout(() => {
            const isAllGood = feedbackList.every(f => f.includes('good') || f.includes('perfect'));
            if (!isAllGood) {
              feedbackList.forEach(f => {
                  if(!f.includes('good') && !f.includes('perfect')) {
                      handleAudioFeedback(f);
                  }
              });
            }
        }, 2000); // 2-second delay to avoid spamming
        return () => clearTimeout(timeoutId);
    }
  }, [feedbackList, selectedPose, handleAudioFeedback]);

  const handleGeneratePlan = async () => {
    if (!goal.trim()) {
      toast({
          variant: "destructive",
          title: "Goal is empty",
          description: "Please enter your yoga goal to generate a plan.",
      });
      return;
    }
    setIsGeneratingPlan(true);
    setGeneratedPlan('');
    try {
        const result = await getYogaPlan({ goal });
        if (result.success && result.plan) {
          setGeneratedPlan(result.plan);
        } else {
          toast({
              variant: "destructive",
              title: "Error",
              description: result.error || 'Failed to generate plan.',
          });
        }
    } catch (e) {
        toast({
              variant: "destructive",
              title: "Error",
              description: 'An unexpected error occurred while generating the plan.',
          });
    } finally {
        setIsGeneratingPlan(false);
    }
  };

  const handlePoseSelection = (poseKey: string) => {
    if (poseKey === 'none') {
        setSelectedPose(null);
        setFeedbackList([]);
    } else {
        setSelectedPose(poseKey as PoseName);
        setFeedbackList([]);
    }
  };

  const hasWebcam = ['webcam_active', 'loading_model', 'detecting'].includes(appState);
  const isUIDisabled = appState === 'loading_model' || appState === 'requesting_permission';

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Video Feed */}
        <div className="lg:col-span-2">
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
                    {(appState === 'loading_model' || appState === 'requesting_permission') && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50 text-white">
                            <Loader className="animate-spin h-8 w-8" />
                            <p className="font-medium">{appState === 'loading_model' ? loadingMessage : 'Requesting camera permission...'}</p>
                        </div>
                    )}
                    {appState === 'error' && (
                        <Alert variant="destructive" className="w-auto">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}
                     <video
                        id="webcam"
                        ref={videoRef}
                        playsInline
                        muted
                        className={`absolute top-0 left-0 w-full h-full object-cover rounded-lg transform -scale-x-100 ${hasWebcam ? 'opacity-100' : 'opacity-0'}`}
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
                       {!hasWebcam && appState !== 'requesting_permission' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center rounded-lg">
                            <Video className="h-12 w-12 mb-4"/>
                            <h3 className="text-lg font-bold">Webcam Disconnected</h3>
                            <p className="text-sm">{appState === 'permission_denied' ? 'Camera access was denied. Please check your browser settings.' : 'Please start your webcam to begin the session.'}</p>
                          </div>
                      )}
                    </div>
                </CardContent>
                 <CardFooter className="flex justify-center gap-4">
                    {hasWebcam ? (
                        <Button variant="destructive" onClick={stopWebcam}><VideoOff className="mr-2 h-4 w-4" />Stop Webcam</Button>
                    ) : (
                        <Button onClick={startWebcam} disabled={isUIDisabled}><Video className="mr-2 h-4 w-4" />Start Webcam</Button>
                    )}
                </CardFooter>
           </Card>
        </div>

        {/* Feedback and Control Panel */}
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Pose Analysis</CardTitle>
              <CardDescription>Select a pose to get live feedback.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select onValueChange={handlePoseSelection} disabled={!hasWebcam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a Pose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {Object.entries(POSES).map(([key, name]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div id="feedback-box" className="mt-4 space-y-2 text-sm min-h-[100px]">
                {selectedPose && hasWebcam ? (
                  feedbackList.length > 0 ? (
                    feedbackList.map((item, index) => {
                      const isGood = item.includes('good') || item.includes('perfect');
                      return (
                          <div key={index} className={`flex items-center gap-2 p-2 rounded-md transition-all duration-300 ${isGood ? 'bg-green-100 dark:bg-green-900/50' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
                              {isGood ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Info className="h-4 w-4 text-amber-600" />}
                              <span className={isGood ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}>{item}</span>
                          </div>
                      );
                    })
                  ) : (
                    <div className="text-muted-foreground pt-4 text-center">Analyzing...</div>
                  )
                ) : (
                   <div className="text-muted-foreground pt-4 text-center">
                    {hasWebcam ? 'Select a pose for feedback.' : 'Start webcam to begin analysis.'}
                   </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Volume2 className="h-4 w-4" />
                    <span>Audio feedback is enabled for corrections.</span>
                </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personalized Plan</CardTitle>
              <CardDescription>Describe your yoga goal and let AI create a plan for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                id="goal-input"
                placeholder="e.g., 'A 15-minute morning routine to improve flexibility.'"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                disabled={isGeneratingPlan}
              />
              <Button onClick={handleGeneratePlan} disabled={isGeneratingPlan} className="w-full">
                {isGeneratingPlan && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Generate My Plan
              </Button>
               {isGeneratingPlan && !generatedPlan && <Skeleton className="h-20 w-full" />}
              {generatedPlan && (
                <Alert variant="default" className="bg-primary/10">
                  <AlertTitle className="font-bold">Your New Yoga Plan</AlertTitle>
                  <AlertDescription className="whitespace-pre-wrap font-code">{generatedPlan}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    