'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { YogiAiLoader } from '@/components/yogi-ai-loader';
import { getYogaPlan } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { POSES, PoseName } from '@/lib/pose-constants';
import { CheckCircle, Info, Loader, Volume2, Waves } from 'lucide-react';
import { PlaceHolderImages, ImagePlaceholder } from '@/lib/placeholder-images';

export default function Home() {
  const { toast } = useToast();
  const [selectedPose, setSelectedPose] = useState<PoseName | null>(null);
  const [selectedPoseImage, setSelectedPoseImage] = useState<ImagePlaceholder | null>(null);
  const [feedbackList, setFeedbackList] = useState<string[]>([]);
  const [goal, setGoal] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [breathingRate, setBreathingRate] = useState<number>(0);

  const handlePoseSelection = (poseKey: string) => {
    if (poseKey === 'none') {
      setSelectedPose(null);
      setSelectedPoseImage(null);
      setFeedbackList([]);
    } else {
      const poseName = poseKey as PoseName;
      setSelectedPose(poseName);
      const image = PlaceHolderImages.find((p) => p.id === poseName) ?? null;
      setSelectedPoseImage(image);
      setFeedbackList([]);
    }
  };

  const handleFeedbackChange = (newFeedback: string[]) => {
    setFeedbackList(currentFeedback => {
        if (JSON.stringify(currentFeedback) !== JSON.stringify(newFeedback)) {
           return newFeedback;
       }
       return currentFeedback;
     });
  };

  const handleGeneratePlan = async () => {
    if (!goal.trim()) {
      toast({
        variant: 'destructive',
        title: 'Goal is empty',
        description: 'Please enter your yoga goal to generate a plan.',
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
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to generate plan.',
        });
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while generating the plan.',
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Icons.yoga className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold text-lg">Yogi.AI</span>
          </div>
          <p className="text-sm text-muted-foreground hidden md:block">Your personal AI yoga instructor.</p>
        </div>
      </header>
      <main className="flex-1 container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <YogiAiLoader
              selectedPose={selectedPose}
              onFeedbackChange={handleFeedbackChange}
              onBreathingUpdate={setBreathingRate}
            />
          </div>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Breathing Monitor</CardTitle>
                <CardDescription>Live feedback on your breath.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
                  <Waves className="h-10 w-10 text-primary" />
                  <p className="text-4xl font-bold">
                    {breathingRate > 0 ? breathingRate.toFixed(0) : '--'}
                  </p>
                  <p className="text-muted-foreground">Breaths per Minute (BPM)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pose Analysis</CardTitle>
                <CardDescription>Select a pose to get live feedback.</CardDescription>
              </CardHeader>
              <CardContent>
                <Select onValueChange={handlePoseSelection} value={selectedPose || 'none'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Pose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {Object.entries(POSES).map(([key, pose]) => (
                      <SelectItem key={key} value={key}>
                        {pose.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedPoseImage && (
                  <div className="mt-4">
                    <Image
                      src={selectedPoseImage.imageUrl}
                      alt={`Example of ${POSES[selectedPose as PoseName].name} pose`}
                      width={600}
                      height={400}
                      className="rounded-md object-cover"
                      data-ai-hint={selectedPoseImage.imageHint}
                    />
                     <p className="text-sm text-muted-foreground mt-2">{selectedPoseImage.description}</p>
                  </div>
                )}

                <div id="feedback-box" className="mt-4 space-y-2 text-sm min-h-[100px]">
                  {selectedPose ? (
                    feedbackList.length > 0 ? (
                      feedbackList.map((item, index) => {
                        const isGood = item.includes('good') || item.includes('perfect');
                        return (
                          <div
                            key={index}
                            className={`flex items-center gap-2 p-2 rounded-md ${
                              isGood
                                ? 'bg-green-100 dark:bg-green-900/50'
                                : 'bg-amber-100 dark:bg-amber-900/50'
                            }`}
                          >
                            {isGood ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Info className="h-4 w-4 text-amber-600" />
                            )}
                            <span
                              className={
                                isGood
                                  ? 'text-green-800 dark:text-green-300'
                                  : 'text-amber-800 dark:text-amber-300'
                              }
                            >
                              {item}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-muted-foreground pt-4 text-center">
                        Analyzing...
                      </div>
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

            <Card>
              <CardHeader>
                <CardTitle>Personalized Plan</CardTitle>
                <CardDescription>
                  Describe your yoga goal and let AI create a plan for you.
                </CardDescription>
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
                  <Alert variant="default">
                    <AlertTitle className="font-bold">Your New Yoga Plan</AlertTitle>
                    <AlertDescription className="whitespace-pre-wrap font-mono">
                      {generatedPlan}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
