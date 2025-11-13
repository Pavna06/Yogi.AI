/**
 * @fileoverview This component is responsible for displaying the real-time camera feed
 * and the AI-driven pose estimation overlay. It acts as a wrapper around the `YogiAiLoader`,
 * which dynamically loads the client-side heavy AI processing logic.
 *
 * This separation ensures that the main application bundle remains small and that the
 * complex AI logic is only loaded when needed, improving initial page load performance.
 */
'use client';
import { YogiAiLoader, YogiAiLoaderProps } from '@/components/yogi-ai-loader';

/**
 * Renders the top-left pane of the dashboard, which contains the camera feed and pose analysis.
 * @param props The properties required by the underlying YogiAiLoader component.
 */
export function CameraPane(props: YogiAiLoaderProps) {
  return <YogiAiLoader {...props} />;
}
