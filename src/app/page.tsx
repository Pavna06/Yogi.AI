
'use client';
import React, { useState } from 'react';
import { Icons } from '@/components/icons';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { SidebarContent } from '@/components/sidebar-content';
import { YogiAiLoader } from '@/components/yogi-ai-loader';
import { PoseName } from '@/lib/pose-constants';

export default function Home() {
  const [selectedPose, setSelectedPose] = useState<PoseName | null>(null);
  const [feedbackList, setFeedbackList] = useState<string[]>([]);

  const handleFeedbackChange = (newFeedback: string[]) => {
    setFeedbackList(currentFeedback => {
        if (JSON.stringify(currentFeedback) !== JSON.stringify(newFeedback)) {
           return newFeedback;
       }
       return currentFeedback;
     });
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent 
          selectedPose={selectedPose}
          onPoseSelect={setSelectedPose}
          feedbackList={feedbackList}
          onFeedbackChange={handleFeedbackChange}
        />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-background">
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <SidebarTrigger className="mr-2" />
              <div className="mr-4 flex items-center">
                <Icons.yoga className="h-6 w-6 mr-2 text-primary" />
                <span className="font-bold text-lg">Yogi.AI</span>
              </div>
              <p className="text-sm text-muted-foreground hidden md:block">Your personal AI yoga instructor.</p>
            </div>
          </header>
          <main className="flex-1 p-4">
             <YogiAiLoader selectedPose={selectedPose} onFeedbackChange={handleFeedbackChange} />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
