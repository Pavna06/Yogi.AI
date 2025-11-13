/**
 * @fileoverview This component acts as a loader for the main AI client.
 * It uses Next.js dynamic imports to lazy-load the `YogiAiClient` component.
 *
 * Why is this important?
 * The `YogiAiClient` contains heavy client-side libraries like TensorFlow.js and MediaPipe.
 * By loading it dynamically (`ssr: false`), we prevent these large libraries from being
 * included in the initial server-rendered HTML and JavaScript bundle. This significantly
 * improves the initial page load time and user experience. A skeleton loader is shown
 * while the component and its dependencies are being loaded on the client-side.
 */
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PoseName, CustomPoseConfig } from '@/lib/pose-constants';

// Define the props that will be passed down to the YogiAiClient component.
// This ensures type safety between the loader and the actual component.
export type YogiAiLoaderProps = {
  selectedPose: PoseName | null;
  poseConfig?: CustomPoseConfig;
  onFeedbackChange: (feedback: string[]) => void;
  onAccuracyChange: (accuracy: number) => void;
  onBreathingUpdate: (rate: number) => void;
  photoDataUri?: string;
};

// Dynamically import the YogiAiClient component.
const YogiAiClient = dynamic(
  // The import() function returns a promise that resolves to the component.
  () => import('@/components/yogi-ai-client').then((mod) => mod.YogiAiClient),
  {
    // `ssr: false` is crucial. It tells Next.js to only render this component on the client.
    ssr: false,
    // The `loading` option provides a fallback UI to display while the component is loading.
    // Here, we use a simple Skeleton component to maintain the layout.
    loading: () => (
      <div className="w-full h-full">
        <Skeleton className="w-full h-full aspect-video" />
      </div>
    ),
  }
);

/**
 * The loader component that wraps the dynamically imported YogiAiClient.
 * It passes all its props directly to the client component once it's loaded.
 */
export function YogiAiLoader(props: YogiAiLoaderProps) {
  return <YogiAiClient {...props} />;
}
