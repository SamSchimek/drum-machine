import './Tooltip.css';

export interface TooltipProps {
  content: string;
  currentStep: number;
  totalSteps: number;
  position: 'top' | 'bottom' | 'left' | 'right';
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isContinuing?: boolean;
  isInteractiveStep?: boolean;
  isStepComplete?: boolean;
}

export function Tooltip({
  content,
  currentStep,
  totalSteps,
  position,
  onNext,
  onPrevious,
  onSkip,
  isContinuing = false,
  isInteractiveStep = false,
  isStepComplete = true,
}: TooltipProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isNextDisabled = isInteractiveStep && !isStepComplete;

  return (
    <div className={`tutorial-tooltip tutorial-tooltip-${position}`}>
      <div className="tutorial-tooltip-content" aria-live="polite">
        {isContinuing && (
          <div className="tutorial-tooltip-continuing">
            Continuing from step {currentStep + 1}
          </div>
        )}
        <p className="tutorial-tooltip-text">{content}</p>
      </div>

      <div className="tutorial-tooltip-footer">
        <span className="tutorial-tooltip-counter">
          {currentStep + 1} of {totalSteps}
        </span>

        <div className="tutorial-tooltip-buttons">
          <button
            type="button"
            className="tutorial-nav-button tutorial-nav-button-skip"
            onClick={onSkip}
            aria-label="Skip tutorial"
          >
            Skip
          </button>

          <button
            type="button"
            className="tutorial-nav-button tutorial-nav-button-prev"
            onClick={onPrevious}
            disabled={isFirstStep}
            aria-label="Previous step"
          >
            Previous
          </button>

          <button
            type="button"
            className="tutorial-nav-button tutorial-nav-button-next"
            onClick={onNext}
            disabled={isNextDisabled}
            aria-label={isLastStep ? 'Finish tutorial' : 'Next step'}
            title={isNextDisabled ? 'Click the highlighted cells to continue' : undefined}
          >
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
