import { useEffect } from 'react';
import useMusicStore from '../store/useMusicStore.js';
import { dispatchCommand } from './commandDispatcher.js';
import { mapKeyboardEventToCommand, shouldPreventDefaultForCommand } from './keyboardMap.js';

function useKeyboardCommands(options = {}) {
  const { enabled = true, dispatch = dispatchCommand } = options;

  useEffect(() => {
    if (!enabled) return undefined;

    const handleKeyboardEvent = (event) => {
      const state = useMusicStore.getState();
      const command = mapKeyboardEventToCommand(event, state);
      if (!command) return;

      if (shouldPreventDefaultForCommand(command)) {
        event.preventDefault();
      }

      void dispatch(command);
    };

    window.addEventListener('keydown', handleKeyboardEvent);
    window.addEventListener('keyup', handleKeyboardEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyboardEvent);
      window.removeEventListener('keyup', handleKeyboardEvent);
    };
  }, [dispatch, enabled]);
}

export default useKeyboardCommands;
