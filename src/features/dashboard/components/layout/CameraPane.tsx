/**
 * @fileoverview This component is responsible for displaying the real-time camera feed
 * and the AI-driven pose estimation overlay. It acts as a wrapper around the `PoseCorrectionLoader`,
 * which dynamically loads the client-side heavy AI processing logic.
 *
 * This separation ensures that the main application bundle remains small and that the
 * complex AI logic is only loaded when needed, improving initial page load performance.
 */
'use client';
import { PoseCorrectionLoader, PoseCorrectionLoaderProps } from '@/features/pose-correction/components/PoseCorrectionLoader';

/**
 * Renders the top-left pane of the dashboard, which contains the camera feed and pose analysis.
 * @param props The properties required by the underlying PoseCorrectionLoader component.
 */
export function CameraPane(props: PoseCorrectionLoaderProps) {
  return <PoseCorrectionLoader {...props} />;
}
