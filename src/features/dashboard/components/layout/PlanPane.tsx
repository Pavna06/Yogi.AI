/**
 * @fileoverview This component handles the "Personalized Plan" feature. It allows
 * users to input a yoga goal and receive an AI-generated yoga sequence.
 */
'use-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader } from 'lucide-react';

interface PlanPaneProps {
  goal: string;
  setGoal: (goal: string) => void;
  isGeneratingPlan: boolean;
  handleGeneratePlan: () => void;
  generatedPlan: string;
}

/**
 * Renders the bottom-right pane of the dashboard, which contains the personalized plan generator.
 */
export function PlanPane({
  goal,
  setGoal,
  isGeneratingPlan,
  handleGeneratePlan,
  generatedPlan,
}: PlanPaneProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalized Plan</CardTitle>
        <CardDescription>
          Describe your yoga goal and let AI create a plan for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input for the user's yoga goal */}
        <Textarea
          id="goal-input"
          placeholder="e.g., 'A 15-minute morning routine to improve flexibility.'"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          disabled={isGeneratingPlan}
        />
        {/* Button to trigger plan generation */}
        <Button
          onClick={handleGeneratePlan}
          disabled={isGeneratingPlan}
          className="w-full"
        >
          {isGeneratingPlan && <Loader className="mr-2 h-4 w-4 animate-spin" />}
          Generate My Plan
        </Button>
        {/* Skeleton loader while waiting for the AI response */}
        {isGeneratingPlan && !generatedPlan && (
          <Skeleton className="h-20 w-full" />
        )}
        {/* Display the generated plan once available */}
        {generatedPlan && (
          <Alert variant="default">
            <AlertTitle className="font-bold">Your New Yoga Plan</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap font-mono">
              {generatedPlan}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
