import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import { useCamera } from '../hooks/useCamera';

export const CameraWindow = () => {
  const { videoRef, cameraReady } = useCamera(); // but we already have a global videoRef? We'll need to lift it.
  // Actually, we should share the same videoRef across components, so we'll move it to context or use a global ref.

  // For simplicity, we'll render the video here and also in other views? But we need one video element for all.
  // Better: put the video element in the CameraWindow, and also pass its ref to useFaceMesh etc.
  // So we will move the video element creation into CameraWindow and share the ref via context.
};