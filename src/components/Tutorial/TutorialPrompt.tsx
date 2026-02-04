import { useEffect, useRef } from 'react';
import { useTutorial } from '../../context/TutorialContext';
import './TutorialPrompt.css';

export function TutorialPrompt() {
  const { showPrompt, startTutorial, dismissPrompt } = useTutorial();
  const dialogRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management: focus "Take the tour" button when prompt opens
  useEffect(() => {
    if (showPrompt && startButtonRef.current) {
      startButtonRef.current.focus();
    }
  }, [showPrompt]);

  // Keyboard: Escape to dismiss + focus trap
  useEffect(() => {
    if (!showPrompt) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismissPrompt();
        return;
      }

      // Focus trap: Tab cycles between the two buttons
      if (e.key === 'Tab') {
        const firstElement = skipButtonRef.current;
        const lastElement = startButtonRef.current;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPrompt, dismissPrompt]);

  if (!showPrompt) return null;

  return (
    <div className="tutorial-prompt-backdrop" onClick={dismissPrompt}>
      <div
        className="tutorial-prompt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-prompt-title"
        aria-describedby="tutorial-prompt-description"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="tutorial-prompt-title">Welcome to 808 Drum Machine</h2>
        <p id="tutorial-prompt-description">Would you like a quick tour of the features?</p>
        <div className="tutorial-prompt-buttons">
          <button
            ref={skipButtonRef}
            onClick={dismissPrompt}
            className="tutorial-prompt-skip"
          >
            No thanks
          </button>
          <button
            ref={startButtonRef}
            onClick={startTutorial}
            className="tutorial-prompt-start"
          >
            Take the tour
          </button>
        </div>
      </div>
    </div>
  );
}
