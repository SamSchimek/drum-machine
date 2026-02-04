import { useEffect, useRef, useState, useCallback } from 'react';
import { useTutorial } from '../../context/TutorialContext';
import { Tooltip } from './Tooltip';
import './TutorialOverlay.css';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
}

const SPOTLIGHT_PADDING = 8;
const TOOLTIP_OFFSET = 12;

export function TutorialOverlay() {
  const {
    isActive,
    currentStep,
    currentStepData,
    totalSteps,
    nextStep,
    previousStep,
    skipTutorial,
    isContinuing,
    isInteractiveStep,
    isStepComplete,
  } = useTutorial();

  const overlayRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0 });

  const updateTargetPosition = useCallback(() => {
    if (!currentStepData) {
      setTargetRect(null);
      return;
    }

    const targetElement = document.querySelector(currentStepData.target);
    if (!targetElement) {
      // Target not found - handle gracefully
      setTargetRect(null);
      return;
    }

    // Use instant scroll to avoid animation timing issues
    if (targetElement.scrollIntoView) {
      try {
        targetElement.scrollIntoView({
          behavior: 'auto',
          block: 'center',
          inline: 'center',
        });
      } catch {
        // Fallback for browsers that don't support options object
        targetElement.scrollIntoView(true);
      }
    }

    // Use double requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const rect = targetElement.getBoundingClientRect();
        const newTargetRect = {
          top: rect.top - SPOTLIGHT_PADDING,
          left: rect.left - SPOTLIGHT_PADDING,
          width: rect.width + SPOTLIGHT_PADDING * 2,
          height: rect.height + SPOTLIGHT_PADDING * 2,
        };
        setTargetRect(newTargetRect);

        // Calculate tooltip position based on the configured position
        const position = calculateTooltipPosition(rect, currentStepData.position);
        setTooltipPosition(position);
      });
    });
  }, [currentStepData]);

  const calculateTooltipPosition = (
    rect: DOMRect,
    position: 'top' | 'bottom' | 'left' | 'right'
  ): TooltipPosition => {
    const tooltipWidth = 320;
    const tooltipHeight = 150; // Approximate

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - TOOLTIP_OFFSET - SPOTLIGHT_PADDING;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + TOOLTIP_OFFSET + SPOTLIGHT_PADDING;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - TOOLTIP_OFFSET - SPOTLIGHT_PADDING;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + TOOLTIP_OFFSET + SPOTLIGHT_PADDING;
        break;
    }

    // Keep tooltip within viewport bounds
    const padding = 16;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    return { top, left };
  };

  // Update position when step changes
  useEffect(() => {
    if (isActive && currentStepData) {
      updateTargetPosition();
    }
  }, [isActive, currentStepData, updateTargetPosition]);

  // Update position on window resize
  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => {
      updateTargetPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isActive, updateTargetPosition]);

  // Focus overlay when active
  useEffect(() => {
    if (isActive && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [isActive]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTutorial();
        return;
      }

      // Only handle arrow keys when overlay is focused
      if (document.activeElement === overlayRef.current) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextStep();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          previousStep();
        }
      }
    },
    [skipTutorial, nextStep, previousStep]
  );

  // Global Escape handler
  useEffect(() => {
    if (!isActive) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTutorial();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isActive, skipTutorial]);

  if (!isActive || !currentStepData) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="tutorial-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Spotlight highlight */}
      {targetRect && (
        <div
          className="tutorial-spotlight"
          style={{
            position: 'fixed',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="tutorial-tooltip-wrapper"
        style={{
          position: 'fixed',
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <Tooltip
          content={currentStepData.content}
          currentStep={currentStep}
          totalSteps={totalSteps}
          position={currentStepData.position}
          onNext={nextStep}
          onPrevious={previousStep}
          onSkip={skipTutorial}
          isContinuing={isContinuing}
          isInteractiveStep={isInteractiveStep}
          isStepComplete={isStepComplete}
        />
      </div>
    </div>
  );
}
