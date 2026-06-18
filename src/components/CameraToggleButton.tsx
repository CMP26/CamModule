import { useAppContext } from '../contexts/AppContext';
import Draggable from 'react-draggable';

export const CameraToggleButton = () => {
  const { state, dispatch } = useAppContext();
  return (
    <Draggable>
      <button
        onClick={() => dispatch({ type: 'TOGGLE_CAMERA' })}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          background: 'none',
          border: 'none',
          fontSize: 32,
          cursor: 'pointer',
          padding: 0,
          outline: 'none',
          opacity: 0.8,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
      >
        {state.showCamera ? '📷' : '📷❌'}
      </button>
    </Draggable>
  );
};