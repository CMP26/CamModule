import { useAppContext } from '../contexts/AppContext';
import Draggable from 'react-draggable';

export const CameraButton = () => {
  const { showCamera, toggleCamera } = useAppContext();
  return (
    <Draggable>
      <button
        onClick={toggleCamera}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          background: 'none',
          border: 'none',
          fontSize: 30,
          cursor: 'pointer',
          padding: 0,
          outline: 'none',
        }}
      >
        {showCamera ? '📷' : '📷❌'} {/* or use icon library */}
      </button>
    </Draggable>
  );
};