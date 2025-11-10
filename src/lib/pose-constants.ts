export type Keypoint = {
  y: number;
  x: number;
  score: number;
  name: string;
};

export type PoseData = {
  keypoints: Keypoint[];
  score: number;
};

export const POSES = {
  Tree: 'Tree',
  Warrior_II: 'Warrior II',
  Triangle: 'Triangle',
  Downward_Dog: 'Downward Dog',
} as const;

export type PoseName = keyof typeof POSES;

type AngleConfig = {
  p1: string;
  p2: string;
  p3: string;
  target: number;
  tolerance: number;
  feedback_low: string;
  feedback_high: string;
  feedback_good: string;
};

export const POSE_CONFIG: Record<PoseName, Record<string, AngleConfig>> = {
  Tree: {
    standingKnee: {
      p1: 'right_hip', p2: 'right_knee', p3: 'right_ankle',
      target: 180, tolerance: 10,
      feedback_low: 'Straighten your standing leg.', feedback_high: '', feedback_good: 'Standing leg is straight.'
    },
    standingHip: {
      p1: 'right_knee', p2: 'right_hip', p3: 'left_hip',
      target: 180, tolerance: 15,
      feedback_low: 'Open your hips more by bringing your raised foot higher.', feedback_high: '', feedback_good: 'Hips are well-aligned.'
    }
  },
  Warrior_II: {
    frontKnee: {
      p1: 'left_hip', p2: 'left_knee', p3: 'left_ankle',
      target: 90, tolerance: 15,
      feedback_low: 'Bend your front knee more to a 90-degree angle.', feedback_high: 'Ease up on your front knee bend.', feedback_good: 'Front knee angle is perfect!'
    },
    backKnee: {
      p1: 'right_hip', p2: 'right_knee', p3: 'right_ankle',
      target: 180, tolerance: 10,
      feedback_low: 'Straighten your back leg completely.', feedback_high: '', feedback_good: 'Back leg is nice and straight.'
    },
    torso: {
      p1: 'left_shoulder', p2: 'right_hip', p3: 'right_shoulder',
      target: 180, tolerance: 20,
      feedback_low: "Keep your torso centered, don't lean forward.", feedback_high: '', feedback_good: 'Torso is centered.'
    }
  },
  Triangle: {
    frontKnee: {
      p1: 'left_hip', p2: 'left_knee', p3: 'left_ankle',
      target: 180, tolerance: 10,
      feedback_low: 'Straighten your front leg.', feedback_high: '', feedback_good: 'Front leg is straight.'
    },
    hipAngle: {
      p1: 'left_knee', p2: 'left_hip', p3: 'right_hip',
      target: 160, tolerance: 15,
      feedback_low: 'Open your hips more towards the ceiling.', feedback_high: '', feedback_good: 'Hips are open.'
    }
  },
  Downward_Dog: {
    knees: {
      p1: 'right_hip', p2: 'right_knee', p3: 'right_ankle',
      target: 180, tolerance: 20,
      feedback_low: 'Try to straighten your legs.', feedback_high: '', feedback_good: 'Legs are straight.'
    },
    hips: {
      p1: 'right_shoulder', p2: 'right_hip', p3: 'right_knee',
      target: 150, tolerance: 15,
      feedback_low: 'Lift your hips higher, creating an inverted V shape.', feedback_high: 'Lower your hips slightly.', feedback_good: 'Hip angle is great.'
    }
  }
};
