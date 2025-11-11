'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { YogiAiClientProps } from './sidebar-content';

const YogiAiClient = dynamic(
  () => import('@/components/yogi-ai-client').then((mod) => mod.YogiAiClient),
  {
    ssr: false,
    loading: () => (
        <div className="container mx-auto p-4">
            <Skeleton className="w-full aspect-video" />
        </div>
    )
  }
);

export function YogiAiLoader(props: YogiAiClientProps) {
  return <YogiAiClient {...props} />;
}
