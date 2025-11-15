/**
 * @fileoverview This component displays a list of all available yoga poses inside a tab.
 * It's designed to be used within the individual pose page, allowing users to easily
 * switch to another pose without returning to the main directory.
 */
'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

interface PoseListPaneProps {
  allPoses: Record<string, { id: string; name: string }>;
  allPoseImages: Record<string, ImagePlaceholder>;
  currentPoseId: string;
}

export function PoseListPane({ allPoses, allPoseImages, currentPoseId }: PoseListPaneProps) {
  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(allPoses).map(([key, pose]) => {
            const image = allPoseImages[key];
            const isSelected = key === currentPoseId;
            return (
            <Link key={key} href={`/poses/${key}`} className="block">
                <Card 
                    className={cn(
                        "group relative overflow-hidden transition-all hover:shadow-md",
                        isSelected && "ring-2 ring-primary ring-offset-2"
                    )}
                >
                    <CardContent className="p-0">
                    <Image
                        src={image?.imageUrl || `https://picsum.photos/seed/${key}/600/400`}
                        alt={`Image of ${pose.name}`}
                        width={300}
                        height={200}
                        className="object-cover aspect-video w-full"
                        data-ai-hint={image?.imageHint || 'yoga pose'}
                    />
                    </CardContent>
                    <CardHeader className="p-3">
                    <CardTitle className="text-sm">{pose.name}</CardTitle>
                    </CardHeader>
                </Card>
            </Link>
            );
        })}
        </div>
    </ScrollArea>
  );
}
