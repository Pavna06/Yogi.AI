/**
 * @fileoverview This is the main landing page of the Yogi.AI application.
 * It serves as a directory, displaying a grid of all available yoga poses.
 *
 * The core responsibilities of this file are:
 * 1.  **Fetch Pose Data**: It uses the `useYogaDashboard` hook to get the list
 *     of all available poses, including default and custom ones.
 * 2.  **Render Pose Grid**: It maps over the list of poses and displays each one
 *     as a clickable card, showing the pose's image and name.
 * 3.  **Navigation**: Clicking on a pose card navigates the user to the
 *     dedicated page for that pose (e.g., `/poses/Tree`).
 * 4.  **Add Custom Pose**: It includes the `AddPoseForm` component to allow
 *     users to add new poses to their library.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useYogaDashboard } from '@/features/dashboard/hooks/useYogaDashboard';
import { AddPoseForm } from '@/features/custom-poses/components/AddPoseForm';
import { Icons } from '@/components/icons';

export default function PoseDirectoryPage() {
  const { allPoses, allPoseImages, userPoses, handleAddPose, handleRemovePose } = useYogaDashboard();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Icons.yoga className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold text-lg">Yogi.AI</span>
          </div>
          <p className="text-sm text-muted-foreground hidden md:block">
            Your personal AI yoga instructor. Select a pose to begin.
          </p>
          <div className="ml-auto">
            <AddPoseForm onAddPose={handleAddPose}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Custom Pose
              </Button>
            </AddPoseForm>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT: POSE GRID */}
      <main className="flex-1 p-4 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Object.entries(allPoses).map(([key, pose]) => {
            const image = allPoseImages[key];
            const isCustom = !!userPoses[key];
            
            return (
              <Card key={key} className="group relative overflow-hidden transition-shadow hover:shadow-lg">
                <Link href={`/poses/${key}`} className="block">
                    <CardContent className="p-0">
                      <Image
                        src={image?.imageUrl || `https://picsum.photos/seed/${key}/600/400`}
                        alt={`Image of ${pose.name}`}
                        width={600}
                        height={400}
                        className="object-cover aspect-video w-full transition-transform group-hover:scale-105"
                        data-ai-hint={image?.imageHint || 'yoga pose'}
                      />
                    </CardContent>
                    <CardHeader className="p-4">
                      <CardTitle>{pose.name}</CardTitle>
                    </CardHeader>
                </Link>
                {/* Add a button to remove custom poses */}
                {isCustom && (
                   <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleRemovePose(key);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove {pose.name}</span>
                    </Button>
                )}
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
