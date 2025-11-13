'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomPoseConfig, KEYPOINTS_MAPPING } from '@/lib/pose-constants';
import { Loader } from 'lucide-react';
import { getAIPoseRules, getAIPoseImage } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface AddPoseFormProps {
  children: React.ReactNode;
  onAddPose: (newPose: {
    name: string;
    id: string;
    description: string;
    imageUrl: string;
    config: CustomPoseConfig;
  }) => void;
}

export function AddPoseForm({ children, onAddPose }: AddPoseFormProps) {
  const { toast } = useToast();
  const [isOpen, setOpen] = useState(false);
  const [poseName, setPoseName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savingStep, setSavingStep] = useState('');

  const resetForm = () => {
    setPoseName('');
    setDescription('');
    setImageUrl('');
    setIsSaving(false);
    setSavingStep('');
  }

  const handleSubmit = async () => {
    if (!poseName || !description) {
        toast({
            variant: "destructive",
            title: "Missing fields",
            description: "Please fill out the pose name and description."
        })
        return;
    }

    setIsSaving(true);
    
    let finalImageUrl = imageUrl;
    let photoDataUri: string | undefined = imageUrl;

    // Step 1: Generate image if URL is not provided
    if (!finalImageUrl) {
        setSavingStep('Generating image...');
        const imageResult = await getAIPoseImage({ poseName, poseDescription: description });
        if (imageResult.success && imageResult.imageUrl) {
            finalImageUrl = imageResult.imageUrl;
            photoDataUri = imageResult.imageUrl; // Use the generated image for rule generation
        } else {
            toast({
                variant: 'destructive',
                title: 'AI Image Generation Failed',
                description: imageResult.error || 'Could not generate an image. Continuing without one.',
            });
            // We can continue without a custom image, but we need to clear photoDataUri
            photoDataUri = undefined;
        }
    }


    // Step 2: Generate rules with AI, using the image if available
    setSavingStep('Generating rules...');
    const aiResult = await getAIPoseRules({ poseName, poseDescription: description, photoDataUri });

    if (!aiResult.success || !aiResult.rules) {
        toast({
            variant: 'destructive',
            title: 'AI Rule Generation Failed',
            description: aiResult.error || 'Could not generate analysis rules for this pose. Please try again.',
        });
        setIsSaving(false);
        return;
    }

    // Convert the AI-generated rules into the CustomPoseConfig format
    const config: CustomPoseConfig = Object.entries(aiResult.rules).reduce((acc, [name, rule]) => {
      // Gracefully handle if a keypoint isn't found, though the AI should be reliable.
      if (KEYPOINTS_MAPPING[rule.p1] !== undefined && KEYPOINTS_MAPPING[rule.p2] !== undefined && KEYPOINTS_MAPPING[rule.p3] !== undefined) {
        acc[name] = {
          p1: KEYPOINTS_MAPPING[rule.p1],
          p2: KEYPOINTS_MAPPING[rule.p2],
          p3: KEYPOINTS_MAPPING[rule.p3],
          target: Number(rule.target),
          tolerance: Number(rule.tolerance),
          feedback_low: rule.feedback_low,
          feedback_high: rule.feedback_high,
          feedback_good: rule.feedback_good,
        };
      }
      return acc;
    }, {} as CustomPoseConfig);

    // Ensure we have at least some rules
    if (Object.keys(config).length === 0) {
        toast({
            variant: 'destructive',
            title: 'AI Rule Generation Failed',
            description: 'The AI could not produce any valid rules from the description. Please try describing the pose differently.',
        });
        setIsSaving(false);
        return;
    }


    const newPose = {
      name: poseName,
      id: poseName.replace(/\s+/g, '_').toLowerCase(),
      description,
      imageUrl: finalImageUrl || '/placeholder.png', // Fallback image if generation fails and none was provided
      config,
    };

    onAddPose(newPose);
    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
      }
      setOpen(open)
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Custom Pose</DialogTitle>
          <DialogDescription>
            Provide the details for a new yoga pose. AI will automatically generate the analysis rules for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Pose Name
            </Label>
            <Input id="name" value={poseName} onChange={(e) => setPoseName(e.target.value)} className="col-span-3" placeholder="e.g., Happy Baby" disabled={isSaving}/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="A detailed description of how to perform the pose." disabled={isSaving}/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="imageUrl" className="text-right">
              Image URL
            </Label>
            <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="col-span-3" placeholder="(Optional) AI will generate one if left blank." disabled={isSaving}/>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? savingStep : 'Save Pose'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
