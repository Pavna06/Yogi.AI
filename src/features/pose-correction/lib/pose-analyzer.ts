/**
 * @fileoverview This file contains the core logic for analyzing a user's yoga pose.
 * It's part of the 'Pose Correction' feature.
 *
 * It defines the `analyzePose` function, which calculates the angles of the user's
 * body joints based on keypoints detected by the AI model. It compares these angles
 * against a set of target rules and generates real-time feedback and an accuracy score.
 */

import { Keypoint, CustomPoseConfig } from '@/lib/pose-constants';

/**
 * Calculates the angle between three keypoints.
 * @param p1 The first keypoint (e.g., shoulder).
 * @param p2 The second keypoint, which is the vertex of the angle (e.g., elbow).
 * @param p3 The third keypoint (e.g., wrist).
 * @returns The angle in degrees, from 0 to 180.
 */
function calculateAngle(p1: Keypoint, p2: Keypoint, p3: Keypoint): number {
  if (!p1 || !p2 || !p3) return 0;

  // Calculate the angle using atan2 and convert from radians to degrees.
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);

  // Ensure the angle is always the smaller of the two possible angles.
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
}

/**
 * Analyzes the user's current pose against a set of predefined rules.
 * @param keypoints The array of keypoints detected from the user's body.
 * @param targetAngles The configuration object containing the rules for the currently selected pose.
 * @returns An object containing an array of feedback messages and an overall accuracy score.
 */
export function analyzePose(keypoints: Keypoint[], targetAngles: CustomPoseConfig): { feedback: string[], accuracy: number } {
  const feedback: string[] = [];
  let totalScore = 0;
  let rulesApplied = 0;

  // Calculate the average confidence score of all keypoints.
  const poseScore = keypoints.reduce((acc, kp) => acc + (kp.score ?? 0), 0) / keypoints.length;
  // If the overall confidence is too low, it means the person is likely not fully in frame.
  if (!targetAngles || poseScore < 0.3) {
    return { feedback: ["Please position yourself clearly in the frame."], accuracy: 0 };
  }

  // Iterate over each rule defined for the current pose.
  for (const joint in targetAngles) {
    rulesApplied++;
    const config = targetAngles[joint];
    const p1 = keypoints[config.p1];
    const p2 = keypoints[config.p2];
    const p3 = keypoints[config.p3];

    // Ensure all three keypoints for the angle were detected with sufficient confidence.
    if (p1 && p2 && p3 && (p1.score ?? 0) > 0.3 && (p2.score ?? 0) > 0.3 && (p3.score ?? 0) > 0.3) {
      const angle = calculateAngle(p1, p2, p3);
      const deviation = Math.abs(angle - config.target);

      if (deviation > config.tolerance) {
        // If the angle is outside the acceptable tolerance, calculate a partial score.
        // The score decreases the further the angle is from the tolerance zone.
        const maxDeviation = config.tolerance + 45; // Max deviation where score becomes 0.
        const ruleScore = Math.max(0, 1 - (deviation - config.tolerance) / (maxDeviation - config.tolerance));
        totalScore += ruleScore;
        
        // Provide specific feedback based on whether the angle is too small or too large.
        if (angle < config.target) {
            if(config.feedback_low) feedback.push(config.feedback_low);
        } else {
            if(config.feedback_high) feedback.push(config.feedback_high);
        }
      } else {
        // If the angle is within tolerance, it's a perfect score for this rule.
        totalScore += 1;
        feedback.push(config.feedback_good);
      }
    }
  }
  
  // If no rules could be applied (e.g., keypoints not visible), return a default message.
  if (rulesApplied === 0) {
    return { feedback: ["Hold the pose..."], accuracy: 0 };
  }
  
  // Calculate the overall accuracy as a percentage.
  const overallAccuracy = (totalScore / rulesApplied) * 100;

  // If no specific feedback was generated, return a generic "Analyzing..." message.
  if (feedback.length === 0) {
     return { feedback: ["Analyzing..."], accuracy: overallAccuracy };
  }

  return { feedback, accuracy: overallAccuracy };
}
