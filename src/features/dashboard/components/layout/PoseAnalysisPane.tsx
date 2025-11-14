/**
 * @fileoverview This component represents the "Pose Analysis" pane. It's the main
 * control center for the user to interact with the pose correction feature.
 *
 * It includes:
 * - A dropdown to select a yoga pose.
 * - A button to add a new custom pose.
 * - An image and description of the selected pose.
 * - A real-time accuracy progress bar.
 * - A list of feedback messages from the AI.
 */
'use client';
import React from 'react';
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
import { Progress } from '@/components/ui/progress';
import { AddPoseForm } from '@/features/custom-poses/components/AddPoseForm';
import { PoseName, CustomPoseConfig } from '@/lib/pose-constants';
import { ImagePlaceholder } from '@/lib/placeholder-images';
import {
  CheckCircle,
  Info,
  PlusCircle,
  Trash2,
  Volume2,
} from 'lucide-react';

interface PoseAnalysisPaneProps {
  // Props for pose selection
  allPoses: Record<string, { id: string; name: string }>;
  userPoses: Record<string, { id: string; name: string }>;
  selectedPose: PoseName | null;
  handlePoseSelection: (poseKey: string) => void;
  handleRemovePose: (poseId: string) => void;
  onAddPose: (newPose: {
    name: string;
    id: string;
    description: string;
    imageUrl: string;
    config: CustomPoseConfig;
  }) => void;

  // Props for displaying analysis results
  selectedPoseImage: ImagePlaceholder | null;
  feedbackList: string[];
  poseAccuracy: number;
}

/**
 * Renders the top-right pane of the dashboard, containing all pose analysis controls and feedback.
 */
export function PoseAnalysisPane({
  allPoses,
  userPoses,
  selectedPose,
  handlePoseSelection,
  handleRemovePose,
  onAddPose,
  selectedPoseImage,
  feedbackList,
  poseAccuracy,
}: PoseAnalysisPaneProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Pose Analysis</CardTitle>
        <CardDescription>Select a pose to get live feedback.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {/* POSE SELECTION DROPDOWN */}
          <Select
            onValueChange={handlePoseSelection}
            value={selectedPose || 'none'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a Pose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {Object.entries(allPoses).map(([key, pose]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center justify-between w-full">
                    <span>{pose.name}</span>
                    {/* Show remove button only for custom user-added poses */}
                    {userPoses[key] && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-4 hover:bg-destructive/20"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent dropdown from closing
                          e.preventDefault(); // Prevent selection
                          handleRemovePose(key);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Remove {pose.name}</span>
                      </Button>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* ADD NEW POSE BUTTON & DIALOG */}
          <AddPoseForm onAddPose={onAddPose}>
            <Button variant="outline" size="icon">
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only">Add New Pose</span>
            </Button>
          </AddPoseForm>
        </div>

        {/* REFERENCE IMAGE for the selected pose */}
        {selectedPoseImage && selectedPose && (
          <div className="mt-4">
            <Image
              src={selectedPoseImage.imageUrl}
              alt={`Example of ${allPoses[selectedPose]?.name} pose`}
              width={600}
              height={400}
              className="rounded-md object-cover aspect-video"
              data-ai-hint={selectedPoseImage.imageHint}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {selectedPoseImage.description}
            </p>
          </div>
        )}

        {/* ACCURACY BAR */}
        {selectedPose && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Accuracy
              </span>
              <Progress value={poseAccuracy} className="w-full" />
              <span className="text-sm font-bold w-12 text-right">
                {poseAccuracy.toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* FEEDBACK LIST */}
        <div
          id="feedback-box"
          className="mt-4 space-y-2 text-sm min-h-[100px]"
        >
          {selectedPose ? (
            feedbackList.length > 0 ? (
              feedbackList.map((item, index) => {
                const isGood =
                  item.includes('good') || item.includes('perfect');
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
  );
}
