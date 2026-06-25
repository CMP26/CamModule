export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

const LEFT_IRIS_CENTER = 468;
const RIGHT_IRIS_CENTER = 473;
const LEFT_EYE_LEFT = 33;
const LEFT_EYE_RIGHT = 133;
const RIGHT_EYE_LEFT = 362;
const RIGHT_EYE_RIGHT = 263;

const NOSE_TIP = 1;
const CHIN = 152;
const LEFT_EYE_OUTER = 226;
const RIGHT_EYE_OUTER = 446;

export function computeGazeRatio(landmarks: NormalizedLandmark[]): {
  leftGaze: number;
  rightGaze: number;
} {
  const leftIris = landmarks[LEFT_IRIS_CENTER];
  const leftLeft = landmarks[LEFT_EYE_LEFT];
  const leftRight = landmarks[LEFT_EYE_RIGHT];

  const rightIris = landmarks[RIGHT_IRIS_CENTER];
  const rightLeft = landmarks[RIGHT_EYE_LEFT];
  const rightRight = landmarks[RIGHT_EYE_RIGHT];

  const leftWidth = leftRight.x - leftLeft.x;
  const leftGaze =
    leftWidth === 0 ? 0 : (leftIris.x - leftLeft.x) / leftWidth - 0.5;

  const rightWidth = rightRight.x - rightLeft.x;
  const rightGaze =
    rightWidth === 0 ? 0 : (rightIris.x - rightLeft.x) / rightWidth - 0.5;

  return { leftGaze: leftGaze * 2, rightGaze: rightGaze * 2 };
}

export function computeHeadYaw(landmarks: NormalizedLandmark[]): number {
  const nose = landmarks[NOSE_TIP];
  const leftEye = landmarks[LEFT_EYE_OUTER];
  const rightEye = landmarks[RIGHT_EYE_OUTER];

  const midX = (leftEye.x + rightEye.x) / 2;
  const faceWidth = rightEye.x - leftEye.x;
  if (faceWidth === 0) return 0;

  const deviation = (nose.x - midX) / faceWidth;
  return deviation * 90;
}

export function computeHeadPitch(landmarks: NormalizedLandmark[]): number {
  const nose = landmarks[NOSE_TIP];
  const chin = landmarks[CHIN];
  const leftEyeOuter = landmarks[LEFT_EYE_OUTER];
  const rightEyeOuter = landmarks[RIGHT_EYE_OUTER];

  const browY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
  const totalHeight = chin.y - browY;
  if (totalHeight === 0) return 0;

  const noseToChinRatio = (chin.y - nose.y) / totalHeight;
  return (noseToChinRatio - 0.5) * 90;
}

export function isGazingAway(
  landmarks: NormalizedLandmark[],
  gazeThreshold = 0.15,
  yawThreshold = 8,
  pitchThreshold = 8,
): boolean {
  const { leftGaze, rightGaze } = computeGazeRatio(landmarks);
  const avgGaze = (Math.abs(leftGaze) + Math.abs(rightGaze)) / 2;
  const yaw = Math.abs(computeHeadYaw(landmarks));
  const pitch = Math.abs(computeHeadPitch(landmarks));
  return (
    avgGaze > gazeThreshold || yaw > yawThreshold || pitch > pitchThreshold
  );
}
