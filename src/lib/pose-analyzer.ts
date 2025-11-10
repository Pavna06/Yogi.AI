import { POSE_CONFIG, Keypoint, PoseData, PoseName } from './pose-constants';

function calculateAngle(p1: Keypoint, p2: Keypoint, p3: Keypoint): number {
  if (!p1 || !p2 || !p3) return 0;

  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);

  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
}

function findKeypoint(keypoints: Keypoint[], name: string): Keypoint | undefined {
  return keypoints.find(kp => kp.name === name);
}

export function analyzePose(pose: PoseData, poseName: PoseName): string[] {
  const feedback: string[] = [];
  const targetAngles = POSE_CONFIG[poseName];

  if (!targetAngles || pose.score < 0.3) {
    return ["Please position yourself clearly in the frame."];
  }

  for (const joint in targetAngles) {
    const config = targetAngles[joint];
    const p1 = findKeypoint(pose.keypoints, config.p1);
    const p2 = findKeypoint(pose.keypoints, config.p2);
    const p3 = findKeypoint(pose.keypoints, config.p3);

    if (p1 && p2 && p3 && p1.score > 0.3 && p2.score > 0.3 && p3.score > 0.3) {
      const angle = calculateAngle(p1, p2, p3);
      
      if (angle < config.target - config.tolerance) {
        if(config.feedback_low) feedback.push(config.feedback_low);
      } else if (angle > config.target + config.tolerance) {
        if(config.feedback_high) feedback.push(config.feedback_high);
      } else {
        feedback.push(config.feedback_good);
      }
    }
  }
  
  if (feedback.length === 0) {
    return ["Hold the pose..."];
  }

  return feedback;
}
