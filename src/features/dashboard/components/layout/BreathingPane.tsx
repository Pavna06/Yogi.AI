/**
 * @fileoverview This component displays the real-time breathing rate monitor.
 * It's a simple, presentational component that visualizes the breaths-per-minute
 * data calculated by the main AI client.
 */
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Waves } from 'lucide-react';

interface BreathingPaneProps {
  breathingRate: number;
}

/**
 * Renders the bottom-left pane of the dashboard, which shows the live breathing rate.
 * @param breathingRate The current breaths-per-minute value.
 */
export function BreathingPane({ breathingRate }: BreathingPaneProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Breathing Monitor</CardTitle>
        <CardDescription>Live feedback on your breath.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4 text-center h-48">
        <Waves className="h-10 w-10 text-primary" />
        <p className="text-4xl font-bold">
          {/* Display the breathing rate, or '--' if it's not available yet. */}
          {breathingRate > 0 ? breathingRate.toFixed(0) : '--'}
        </p>
        <p className="text-muted-foreground">Breaths per Minute (BPM)</p>
      </CardContent>
    </Card>
  );
}
