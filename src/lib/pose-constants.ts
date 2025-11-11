export type Keypoint = {
  y: number;
  x: number;
  z?: number;
  score?: number;
  name?: string;
};

export const POSES = {
  Tree: { id: 'Tree', name: 'Tree' },
  Warrior_II: { id: 'Warrior_II', name: 'Warrior II' },
  Triangle: { id: 'Triangle', name: 'Triangle' },
  Downward_Dog: { id: 'Downward_Dog', name: 'Downward Dog' },
  Staff: { id: 'Staff', name: 'Staff Pose' },
  Bound_Angle: { id: 'Bound_Angle', name: 'Bound Angle Pose' },
} as const;

export type PoseName = keyof typeof POSES;

// Keypoint indices from MediaPipe Pose
export const KEYPOINTS_MAPPING = {
  'nose': 0,
  'left_eye_inner': 1, 'left_eye': 2, 'left_eye_outer': 3,
  'right_eye_inner': 4, 'right_eye': 5, 'right_eye_outer': 6,
  'left_ear': 7, 'right_ear': 8,
  'mouth_left': 9, 'mouth_right': 10,
  'left_shoulder': 11, 'right_shoulder': 12,
  'left_elbow': 13, 'right_elbow': 14,
  'left_wrist': 15, 'right_wrist': 16,
  'left_pinky': 17, 'right_pinky': 18,
  'left_index': 19, 'right_index': 20,
  'left_thumb': 21, 'right_thumb': 22,
  'left_hip': 23, 'right_hip': 24,
  'left_knee': 25, 'right_knee': 26,
  'left_ankle': 27, 'right_ankle': 28,
  'left_heel': 29, 'right_heel': 30,
  'left_foot_index': 31, 'right_foot_index': 32
};

type AngleConfig = {
  p1: number;
  p2: number;
  p3: number;
  target: number;
  tolerance: number;
  feedback_low: string;
  feedback_high: string;
  feedback_good: string;
};

export const POSE_CONFIG: Record<PoseName, Record<string, AngleConfig>> = {
  Tree: {
    standingKnee: {
      p1: KEYPOINTS_MAPPING.right_hip, p2: KEYPOINTS_MAPPING.right_knee, p3: KEYPOINTS_MAPPING.right_ankle,
      target: 180, tolerance: 10,
      feedback_low: 'Straighten your standing leg.', feedback_high: '', feedback_good: 'Standing leg is straight.'
    },
    standingHip: {
      p1: KEYPOINTS_MAPPING.right_knee, p2: KEYPOINTS_MAPPING.right_hip, p3: KEYPOINTS_MAPPING.left_hip,
      target: 180, tolerance: 15,
      feedback_low: 'Open your hips more by bringing your raised foot higher.', feedback_high: '', feedback_good: 'Hips are well-aligned.'
    }
  },
  Warrior_II: {
    frontKnee: {
      p1: KEYPOINTS_MAPPING.left_hip, p2: KEYPOINTS_MAPPING.left_knee, p3: KEYPOINTS_MAPPING.left_ankle,
      target: 90, tolerance: 15,
      feedback_low: 'Bend your front knee more to a 90-degree angle.', feedback_high: 'Ease up on your front knee bend.', feedback_good: 'Front knee angle is perfect!'
    },
    backKnee: {
      p1: KEYPOINTS_MAPPING.right_hip, p2: KEYPOINTS_MAPPING.right_knee, p3: KEYPOINTS_MAPPING.right_ankle,
      target: 180, tolerance: 10,
      feedback_low: 'Straighten your back leg completely.', feedback_high: '', feedback_good: 'Back leg is nice and straight.'
    },
    torso: {
      p1: KEYPOINTS_MAPPING.left_shoulder, p2: KEYPOINTS_MAPPING.right_hip, p3: KEYPOINTS_MAPPING.right_shoulder,
      target: 180, tolerance: 20,
      feedback_low: "Keep your torso centered, don't lean forward.", feedback_high: '', feedback_good: 'Torso is centered.'
    }
  },
  Triangle: {
    frontKnee: {
      p1: KEYPOINTS_MAPPING.left_hip, p2: KEYPOINTS_MAPPING.left_knee, p3: KEYPOINTS_MAPPING.left_ankle,
      target: 180, tolerance: 10,
      feedback_low: 'Straighten your front leg.', feedback_high: '', feedback_good: 'Front leg is straight.'
    },
    hipAngle: {
      p1: KEYPOINTS_MAPPING.left_knee, p2: KEYPOINTS_MAPPING.left_hip, p3: KEYPOINTS_MAPPING.right_hip,
      target: 160, tolerance: 15,
      feedback_low: 'Open your hips more towards the ceiling.', feedback_high: '', feedback_good: 'Hips are open.'
    }
  },
  Downward_Dog: {
    knees: {
      p1: KEYPOINTS_MAPPING.right_hip, p2: KEYPOINTS_MAPPING.right_knee, p3: KEYPOINTS_MAPPING.right_ankle,
      target: 180, tolerance: 20,
      feedback_low: 'Try to straighten your legs.', feedback_high: '', feedback_good: 'Legs are straight.'
    },
    hips: {
      p1: KEYPOINTS_MAPPING.right_shoulder, p2: KEYPOINTS_MAPPING.right_hip, p3: KEYPOINTS_MAPPING.right_knee,
      target: 150, tolerance: 15,
      feedback_low: 'Lift your hips higher, creating an inverted V shape.', feedback_high: 'Lower your hips slightly.', feedback_good: 'Hip angle is great.'
    }
  },
  Staff: {
    back: {
        p1: KEYPOINTS_MAPPING.right_shoulder, p2: KEYPOINTS_MAPPING.right_hip, p3: KEYPOINTS_MAPPING.right_knee,
        target: 90, tolerance: 15,
        feedback_low: 'Sit up straighter, bring your torso to a 90-degree angle with your legs.', feedback_high: 'Lean back slightly to straighten your spine.', feedback_good: 'Your back is perfectly straight.'
    },
    legs: {
        p1: KEYPOINTS_MAPPING.right_hip, p2: KEYPOINTS_MAPPING.right_knee, p3: KEYPOINTS_MAPPING.right_ankle,
        target: 180, tolerance: 15,
        feedback_low: 'Straighten your legs completely.', feedback_high: '', feedback_good: 'Your legs are nice and straight.'
    }
  },
  Bound_Angle: {
    left_knee: {
        p1: KEYPOINTS_MAPPING.left_hip, p2: KEYPOINTS_MAPPING.left_knee, p3: KEYPOINTS_MAPPING.left_ankle,
        target: 60, tolerance: 15,
        feedback_low: '', feedback_high: 'Try to lower your left knee towards the floor.', feedback_good: 'Your left knee is in a good position.'
    },
    right_knee: {
        p1: KEYPOINTS_MAPPING.right_hip, p2: KEYPOINTS_MAPPING.right_knee, p3: KEYPOINTS_MAPPING.right_ankle,
        target: 60, tolerance: 15,
        feedback_low: '', feedback_high: 'Try to lower your right knee towards the floor.', feedback_good: 'Your right knee is in a good position.'
    }
  }
};
