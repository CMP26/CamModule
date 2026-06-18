// ============================================================
// Utility — Gaze & Head Angle Calculations
// Pure functions operating on MediaPipe landmark arrays.
// Landmark indices: https://google.github.io/mediapipe/solutions/face_mesh
// ============================================================

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

// ── Iris landmark indices (only available with refineLandmarks: true) ──
const LEFT_IRIS_CENTER = 468;
const RIGHT_IRIS_CENTER = 473;
const LEFT_EYE_LEFT = 33;
const LEFT_EYE_RIGHT = 133;
const RIGHT_EYE_LEFT = 362;
const RIGHT_EYE_RIGHT = 263;

// ── Head pose reference points ──
const NOSE_TIP = 1;
const CHIN = 152;
const LEFT_EYE_OUTER = 226;
const RIGHT_EYE_OUTER = 446;

/**
 * Computes normalised iris position within each eye socket.
 * Returns a value in [-1, 1] where 0 = centered.
 */
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

/**
 * Estimates horizontal head yaw from face-width asymmetry.
 * Returns angle in degrees. Positive = turning right.
 */
export function computeHeadYaw(landmarks: NormalizedLandmark[]): number {
  const nose = landmarks[NOSE_TIP];
  const leftEye = landmarks[LEFT_EYE_OUTER];
  const rightEye = landmarks[RIGHT_EYE_OUTER];

  const midX = (leftEye.x + rightEye.x) / 2;
  const faceWidth = rightEye.x - leftEye.x;
  if (faceWidth === 0) return 0;

  // How far nose deviates from face center, normalised to face width
  const deviation = (nose.x - midX) / faceWidth;
  return deviation * 90; // rough conversion to degrees
}

/**
 * Estimates vertical head pitch from nose-to-chin vs nose-to-brow.
 * Returns angle in degrees. Positive = looking down.
 */
export function computeHeadPitch(landmarks: NormalizedLandmark[]): number {
  const nose = landmarks[NOSE_TIP];
  const chin = landmarks[CHIN];
  const leftEyeOuter = landmarks[LEFT_EYE_OUTER];
  const rightEyeOuter = landmarks[RIGHT_EYE_OUTER];

  const browY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
  const totalHeight = chin.y - browY;
  if (totalHeight === 0) return 0;

  const noseToChinRatio = (chin.y - nose.y) / totalHeight;
  // When looking forward noseToChinRatio ≈ 0.5
  return (noseToChinRatio - 0.5) * 90;
}

/**
 * Combines gaze + head pose to decide if the student is looking away.
 */
export function isGazingAway(
  landmarks: NormalizedLandmark[],
  gazeThreshold = 0.15, // lowered from 0.25
  yawThreshold = 8, // lowered from 12
  pitchThreshold = 8, // lowered from 12
): boolean {
  const { leftGaze, rightGaze } = computeGazeRatio(landmarks);
  const avgGaze = (Math.abs(leftGaze) + Math.abs(rightGaze)) / 2;
  const yaw = Math.abs(computeHeadYaw(landmarks));
  const pitch = Math.abs(computeHeadPitch(landmarks));
  return (
    avgGaze > gazeThreshold || yaw > yawThreshold || pitch > pitchThreshold
  );
}
