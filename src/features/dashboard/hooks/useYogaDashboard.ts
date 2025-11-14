/**
 * @fileoverview This custom hook centralizes all the state management and business logic
 * for the Yogi.AI application's dashboard. By encapsulating the state and its update logic here,
 * the main UI components remain clean, focused, and easier to understand.
 *
 * It manages:
 * - The list of all yoga poses, including default and user-added custom poses.
 * - The currently selected pose and its associated image.
 * - Live feedback from the pose analysis, including accuracy and breathing rate.
 * - The state for the personalized yoga plan generator.
 */
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getYogaPlan } from '@/app/actions';
import {
  POSES,
  PoseName,
  POSE_CONFIG,
  CustomPoseConfig,
} from '@/lib/pose-constants';
import {
  PlaceHolderImages,
  ImagePlaceholder,
} from '@/lib/placeholder-images';

// Create a unified dictionary for all default pose images for quick lookup.
const defaultPoseImages: Record<string, ImagePlaceholder> =
  PlaceHolderImages.reduce((acc, img) => {
    acc[img.id] = img;
    return acc;
  }, {} as Record<string, ImagePlaceholder>);

// The core hook for managing the dashboard's state.
export function useYogaDashboard() {
  const { toast } = useToast();

  // STATE MANAGEMENT //

  // --- Poses ---
  // State for user-added custom poses (name and ID).
  const [userPoses, setUserPoses] = useState<
    Record<string, { id: string; name: string }>
  >({});
  // State for the analysis configuration of custom poses.
  const [userPoseConfigs, setUserPoseConfigs] = useState<
    Record<string, CustomPoseConfig>
  >({});
  // State for the images of custom poses.
  const [userPoseImages, setUserPoseImages] = useState<
    Record<string, ImagePlaceholder>
  >({});

  // --- Selections ---
  // State for the currently selected pose by the user.
  const [selectedPose, setSelectedPose] = useState<PoseName | null>(null);
  // State for the image corresponding to the selected pose.
  const [selectedPoseImage, setSelectedPoseImage] =
    useState<ImagePlaceholder | null>(null);

  // --- Real-time Analysis ---
  // State for the list of feedback messages from the AI.
  const [feedbackList, setFeedbackList] = useState<string[]>([]);
  // State for the real-time pose accuracy percentage.
  const [poseAccuracy, setPoseAccuracy] = useState(0);
  // State for the calculated breathing rate.
  const [breathingRate, setBreathingRate] = useState<number>(0);

  // --- Plan Generation ---
  // State for the user's yoga goal input.
  const [goal, setGoal] = useState('');
  // State to track if the AI is currently generating a plan.
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  // State to store the AI-generated yoga plan.
  const [generatedPlan, setGeneratedPlan] = useState('');

  // DERIVED STATE //
  // These variables combine default data with user-added data for a unified view.

  // A complete dictionary of all available poses (default + custom).
  const allPoses = { ...POSES, ...userPoses };
  // A complete dictionary of all pose analysis configurations.
  const allPoseConfigs = { ...POSE_CONFIG, ...userPoseConfigs };
  // A complete dictionary of all pose images.
  const allPoseImages = { ...defaultPoseImages, ...userPoseImages };

  // HANDLERS & LOGIC //

  /**
   * Handles the selection of a yoga pose from the dropdown.
   * @param poseKey The unique identifier for the selected pose.
   */
  const handlePoseSelection = (poseKey: string) => {
    if (poseKey === 'none') {
      // If "None" is selected, reset all pose-related states.
      setSelectedPose(null);
      setSelectedPoseImage(null);
      setFeedbackList([]);
      setPoseAccuracy(0);
    } else {
      // Otherwise, set the selected pose and its corresponding image.
      const poseName = poseKey as PoseName;
      setSelectedPose(poseName);
      const image = allPoseImages[poseName] || null;
      setSelectedPoseImage(image);
      // Reset feedback and accuracy for the new pose.
      setFeedbackList([]);
      setPoseAccuracy(0);
    }
  };

  /**
   * Handles adding a new custom pose to the application state.
   * This function is called from the `AddPoseForm` component upon successful submission.
   * @param newPose An object containing all the details of the newly created pose.
   */
  const handleAddPose = (newPose: {
    name: string;
    id: string;
    description: string;
    imageUrl: string;
    config: CustomPoseConfig;
  }) => {
    const { id, name, description, imageUrl, config } = newPose;
    // Add the new pose to the respective state objects.
    setUserPoses((prev) => ({ ...prev, [id]: { id, name } }));
    setUserPoseConfigs((prev) => ({ ...prev, [id]: config }));
    setUserPoseImages((prev) => ({
      ...prev,
      [id]: { id, description, imageUrl, imageHint: name.toLowerCase() },
    }));

    toast({
      title: 'Pose Added!',
      description: `${name} has been added to your pose library.`,
    });
    // Automatically select the newly added pose for immediate use.
    handlePoseSelection(id);
  };

  /**
   * Handles the removal of a custom pose from the application state.
   * @param poseIdToRemove The unique identifier of the pose to remove.
   */
  const handleRemovePose = (poseIdToRemove: string) => {
    // Prevent removing default poses, which are part of the core app.
    if (POSES[poseIdToRemove as keyof typeof POSES]) {
      return;
    }

    const poseName = userPoses[poseIdToRemove]?.name || 'The pose';

    // Remove the pose from all related state objects.
    setUserPoses((prev) => {
      const next = { ...prev };
      delete next[poseIdToRemove];
      return next;
    });
    setUserPoseConfigs((prev) => {
      const next = { ...prev };
      delete next[poseIdToRemove];
      return next;
    });
    setUserPoseImages((prev) => {
      const next = { ...prev };
      delete next[poseIdToRemove];
      return next;
    });

    // If the removed pose was the one currently selected, reset the selection.
    if (selectedPose === poseIdToRemove) {
      handlePoseSelection('none');
    }

    toast({
      title: 'Pose Removed',
      description: `${poseName} has been removed from your library.`,
    });
  };

  /**
   * Handles the request to generate a personalized yoga plan using AI.
   */
  const handleGeneratePlan = async () => {
    if (!goal.trim()) {
      toast({
        variant: 'destructive',
        title: 'Goal is empty',
        description: 'Please enter your yoga goal to generate a plan.',
      });
      return;
    }
    // Set loading state and clear any previous plan.
    setIsGeneratingPlan(true);
    setGeneratedPlan('');
    try {
      // Call the server action to get the AI-generated plan.
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

  // Return all state and handlers to be used by components.
  return {
    // State
    userPoses,
    selectedPose,
    selectedPoseImage,
    feedbackList,
    poseAccuracy,
    goal,
    isGeneratingPlan,
    generatedPlan,
    breathingRate,

    // Derived State
    allPoses,
    allPoseConfigs,

    // Setters & Handlers
    handlePoseSelection,
    setFeedbackList,
    setPoseAccuracy,
    handleGeneratePlan,
    setGoal,
    handleAddPose,
    handleRemovePose,
    setBreathingRate,
  };
}
