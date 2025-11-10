import type { Keypoint } from './pose-constants';

const SKELETON_COLOR = '#00BFFF'; // Deep sky blue (accent color)
const KEYPOINT_COLOR = '#7B68EE'; // Medium slate blue (primary color)
const LINE_WIDTH = 3;
const KEYPOINT_RADIUS = 4;

const connected_keypoints_indices = [
    [0, 1], [0, 2], [1, 3], [2, 4], // Head
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // Torso
    [5, 11], [6, 12], [11, 12], // Hips
    [11, 13], [13, 15], [12, 14], [14, 16] // Legs
];

function drawSegment([ay, ax]: number[], [by, bx]: number[], color: string, scale: number, ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.moveTo(ax * scale, ay * scale);
    ctx.lineTo(bx * scale, by * scale);
    ctx.lineWidth = LINE_WIDTH;
    ctx.strokeStyle = color;
    ctx.stroke();
}

export function drawSkeleton(keypoints: Keypoint[], minConfidence: number, ctx: CanvasRenderingContext2D, scale = 1) {
    const keypointsWithNames: { [key: string]: Keypoint } = {};
    for (const keypoint of keypoints) {
        keypointsWithNames[keypoint.name] = keypoint;
    }

    const adjacentKeyPoints = [
        ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'],
        ['left_elbow', 'left_wrist'], ['right_shoulder', 'right_elbow'],
        ['right_elbow', 'right_wrist'], ['left_shoulder', 'left_hip'],
        ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'],
        ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
        ['right_hip', 'right_knee'], ['right_knee', 'right_ankle']
    ];

    adjacentKeyPoints.forEach((pair) => {
        const kp1 = keypointsWithNames[pair[0]];
        const kp2 = keypointsWithNames[pair[1]];

        if (kp1 && kp2 && kp1.score > minConfidence && kp2.score > minConfidence) {
            drawSegment([kp1.y, kp1.x], [kp2.y, kp2.x], SKELETON_COLOR, scale, ctx);
        }
    });
}

export function drawKeypoints(keypoints: Keypoint[], minConfidence: number, ctx: CanvasRenderingContext2D, scale = 1) {
    for (const kp of keypoints) {
        if (kp.score > minConfidence) {
            const { y, x } = kp;
            ctx.beginPath();
            ctx.arc(x * scale, y * scale, KEYPOINT_RADIUS, 0, 2 * Math.PI);
            ctx.fillStyle = KEYPOINT_COLOR;
            ctx.fill();
        }
    }
}
