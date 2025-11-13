/**
 * @fileoverview This is the main page component for the Yogi.AI application.
 * It serves as the primary layout container, organizing the different UI panes.
 *
 * The core responsibilities of this file are:
 * 1.  **Layout Management**: It defines the 2x2 grid structure for the dashboard,
 *     placing the Camera, Pose Analysis, Breathing, and Plan panes in their
 *     respective positions.
 * 2.  **State Management**: It utilizes the `useYogaApp` custom hook to centralize
 *     all application state and logic. This keeps the component clean and focused
 *     on rendering the layout.
 * 3.  **Component Integration**: It imports and renders the individual pane components,
 *     passing the necessary state and handlers to them as props.
 */
'use client';
import React from 'react';
import { Icons } from '@/components/icons';
import { useYogaApp } from '@/hooks/use-yoga-app';
import { CameraPane } from '@/components/layout/CameraPane';
import { PoseAnalysisPane } from '@/components/layout/PoseAnalysisPane';
import { BreathingPane } from '@/components/layout/BreathingPane';
import { PlanPane } from '@/components/layout/PlanPane';

export default function Home() {
  // The useYogaApp hook provides all the state and functions needed by the UI.
  // This keeps the main page component clean and focused on layout.
  const yogaApp = useYogaApp();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* HEADER: Contains the app title and a brief description. */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Icons.yoga className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold text-lg">Yogi.AI</span>
          </div>
          <p className="text-sm text-muted-foreground hidden md:block">
            Your personal AI yoga instructor.
          </p>
        </div>
      </header>

      {/* MAIN CONTENT AREA: A 2x2 grid for the dashboard panes. */}
      <main className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 md:h-[calc(100vh-57px)]">
          {/* Top-Left Pane: Camera Feed */}
          <div className="md:h-full p-4 md:p-8 border-r border-b">
            <CameraPane
              selectedPose={yogaApp.selectedPose}
              poseConfig={
                yogaApp.selectedPose
                  ? yogaApp.allPoseConfigs[yogaApp.selectedPose]
                  : undefined
              }
              onFeedbackChange={yogaApp.setFeedbackList}
              onAccuracyChange={yogaApp.setPoseAccuracy}
              onBreathingUpdate={yogaApp.setBreathingRate}
              photoDataUri={yogaApp.selectedPoseImage?.imageUrl}
            />
          </div>

          {/* Top-Right Pane: Pose Analysis and Selection */}
          <div className="md:h-full md:overflow-y-auto p-4 md:p-8 border-b">
            <PoseAnalysisPane
              // Props for pose selection
              allPoses={yogaApp.allPoses}
              userPoses={yogaApp.userPoses}
              selectedPose={yogaApp.selectedPose}
              handlePoseSelection={yogaApp.handlePoseSelection}
              handleRemovePose={yogaApp.handleRemovePose}
              onAddPose={yogaApp.handleAddPose}
              // Props for displaying analysis results
              selectedPoseImage={yogaApp.selectedPoseImage}
              feedbackList={yogaApp.feedbackList}
              poseAccuracy={yogaApp.poseAccuracy}
            />
          </div>

          {/* Bottom-Left Pane: Breathing Monitor */}
          <div className="md:h-full p-4 md:p-8 border-r">
            <BreathingPane breathingRate={yogaApp.breathingRate} />
          </div>

          {/* Bottom-Right Pane: Personalized Plan Generator */}
          <div className="md:h-full p-4 md:p-8">
            <PlanPane
              goal={yogaApp.goal}
              setGoal={yogaApp.setGoal}
              isGeneratingPlan={yogaApp.isGeneratingPlan}
              handleGeneratePlan={yogaApp.handleGeneratePlan}
              generatedPlan={yogaApp.generatedPlan}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
