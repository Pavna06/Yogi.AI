'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const YogiAiClient = dynamic(
  () => import('@/components/yogi-ai-client').then((mod) => mod.YogiAiClient),
  { 
    ssr: false,
    loading: () => (
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="w-full aspect-video" />
          </div>
          <div className="lg:col-span-1 space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }
);

export function YogiAiLoader() {
  return <YogiAiClient />;
}
