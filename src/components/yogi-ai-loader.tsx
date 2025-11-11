'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PoseName } from '@/lib/pose-constants';

export type YogiAiClientProps = {
  selectedPose: PoseName | null;
  onFeedbackChange: (feedback: string[]) => void;
  onBreathingUpdate: (rate: number) => void;
};


const YogiAiClient = dynamic(
  () => import('@/components/yogi-ai-client').then((mod) => mod.YogiAiClient),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full">
          <Skeleton className="w-full h-full aspect-video" />
      </div>
    )
  }
);

export function YogiAiLoader(props: YogiAiClientProps) {
  return <YogiAiClient {...props} />;
}
