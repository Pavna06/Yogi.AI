'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  SidebarContent as SidebarContentWrapper,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel
} from '@/components/ui/sidebar';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { getAudioFeedback, getYogaPlan } from '@/app/actions';
import { POSES, PoseName } from '@/lib/pose-constants';
import { CheckCircle, Info, Loader, Volume2 } from 'lucide-react';
import { PlaceHolderImages, ImagePlaceholder } from '@/lib/placeholder-images';

export type SidebarProps = {
    selectedPose: PoseName | null;
    onPoseSelect: (pose: PoseName | null) => void;
    feedbackList: string[];
    onFeedbackChange: (feedback: string[]) => void;
};

export function SidebarContent({ selectedPose, onPoseSelect, feedbackList, onFeedbackChange }: SidebarProps) {
  const { toast } = useToast();
  const audioQueueRef = useRef<string[]>([]);
  const [selectedPoseImage, setSelectedPoseImage] = useState<ImagePlaceholder | null>(null);
  const [goal, setGoal] = useState<string>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string>('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    if (selectedPose) {
        const image = PlaceHolderImages.find(p => p.id === selectedPose) ?? null;
        setSelectedPoseImage(image);
    } else {
        setSelectedPoseImage(null);
    }
  }, [selectedPose]);

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
        onPoseSelect(null);
        onFeedbackChange([]);
    } else {
        onPoseSelect(poseKey as PoseName);
        onFeedbackChange([]);
    }
  };

  return (
    <SidebarContentWrapper>
        <SidebarHeader>
            <Card className="bg-transparent border-0 shadow-none">
                <CardHeader>
                    <CardTitle>Pose Analysis</CardTitle>
                    <CardDescription>Select a pose to get live feedback.</CardDescription>
                </CardHeader>
                <CardContent>
                <Select onValueChange={handlePoseSelection} value={selectedPose || 'none'}>
                    <SelectTrigger className="transition-all duration-300">
                    <SelectValue placeholder="Select a Pose" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {Object.entries(POSES).map(([key, pose]) => (
                        <SelectItem key={key} value={key}>{pose.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                
                {selectedPoseImage && (
                    <div className="mt-4 space-y-2">
                    <div className="relative aspect-video w-full overflow-hidden rounded-md">
                        <Image 
                        src={selectedPoseImage.imageUrl}
                        alt={`Example of ${POSES[selectedPose as PoseName].name} pose`}
                        fill
                        className="rounded-md object-cover transition-transform duration-300 hover:scale-105"
                        data-ai-hint={selectedPoseImage.imageHint}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground p-2 bg-secondary rounded-md">{selectedPoseImage.description}</p>
                    </div>
                )}

                <div id="feedback-box" className="mt-4 space-y-2 text-sm min-h-[100px]">
                    {selectedPose ? (
                    feedbackList.length > 0 ? (
                        feedbackList.map((item, index) => {
                        const isGood = item.includes('good') || item.includes('perfect');
                        return (
                            <div key={index} className={`flex items-center gap-2 p-2 rounded-md transition-all duration-300 ${isGood ? 'bg-green-100 dark:bg-green-900/50' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
                                {isGood ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Info className="h-4 w-4 text-amber-600" />}
                                <span className={`transition-colors duration-300 ${isGood ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}`}>{item}</span>
                            </div>
                        );
                        })
                    ) : (
                        <div className="text-muted-foreground pt-4 text-center">Analyzing...</div>
                    )
                    ) : (
                    <div className="text-muted-foreground pt-4 text-center">
                        Select a pose for feedback.
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
        </SidebarHeader>

        <SidebarGroup>
          <SidebarGroupContent>
            <Card className="bg-transparent border-0 shadow-none">
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
                    className="transition-all duration-300"
                />
                <Button onClick={handleGeneratePlan} disabled={isGeneratingPlan} className="w-full transition-all duration-300">
                    {isGeneratingPlan && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                    Generate My Plan
                </Button>
                {isGeneratingPlan && !generatedPlan && <Skeleton className="h-20 w-full" />}
                {generatedPlan && (
                    <Alert variant="default" className="bg-primary/10 border-primary/20 transition-all duration-300">
                    <AlertTitle className="font-bold text-primary">Your New Yoga Plan</AlertTitle>
                    <AlertDescription className="whitespace-pre-wrap font-code">{generatedPlan}</AlertDescription>
                    </Alert>
                )}
                </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarFooter>
        </SidebarFooter>
    </SidebarContentWrapper>
  );
}
