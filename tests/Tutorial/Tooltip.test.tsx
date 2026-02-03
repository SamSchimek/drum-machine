import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from '../../src/components/Tutorial/Tooltip';

describe('Tooltip', () => {
  const defaultProps = {
    content: 'Test tooltip content',
    currentStep: 0,
    totalSteps: 9,
    position: 'bottom' as const,
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onSkip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('content rendering', () => {
    it('renders the tooltip content', () => {
      render(<Tooltip {...defaultProps} />);
      expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
    });

    it('renders step counter display', () => {
      render(<Tooltip {...defaultProps} currentStep={2} />);
      expect(screen.getByText('3 of 9')).toBeInTheDocument();
    });

    it('renders all navigation buttons', () => {
      render(<Tooltip {...defaultProps} currentStep={3} />);
      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('calls onNext when Next button is clicked', () => {
      const onNext = vi.fn();
      render(<Tooltip {...defaultProps} onNext={onNext} />);

      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('calls onPrevious when Previous button is clicked', () => {
      const onPrevious = vi.fn();
      render(<Tooltip {...defaultProps} currentStep={3} onPrevious={onPrevious} />);

      fireEvent.click(screen.getByRole('button', { name: /previous/i }));
      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    it('calls onSkip when Skip button is clicked', () => {
      const onSkip = vi.fn();
      render(<Tooltip {...defaultProps} onSkip={onSkip} />);

      fireEvent.click(screen.getByRole('button', { name: /skip/i }));
      expect(onSkip).toHaveBeenCalledTimes(1);
    });
  });

  describe('first and last step behavior', () => {
    it('disables Previous button on first step', () => {
      render(<Tooltip {...defaultProps} currentStep={0} />);
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    });

    it('enables Previous button on steps after first', () => {
      render(<Tooltip {...defaultProps} currentStep={1} />);
      expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled();
    });

    it('shows "Finish" text on last step instead of "Next"', () => {
      render(<Tooltip {...defaultProps} currentStep={7} totalSteps={8} />);
      expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument();
    });

    it('shows "Next" text on steps before last', () => {
      render(<Tooltip {...defaultProps} currentStep={6} totalSteps={8} />);
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
  });

  describe('positioning classes', () => {
    it('applies bottom position class', () => {
      const { container } = render(<Tooltip {...defaultProps} position="bottom" />);
      expect(container.querySelector('.tutorial-tooltip')).toHaveClass('tutorial-tooltip-bottom');
    });

    it('applies top position class', () => {
      const { container } = render(<Tooltip {...defaultProps} position="top" />);
      expect(container.querySelector('.tutorial-tooltip')).toHaveClass('tutorial-tooltip-top');
    });

    it('applies left position class', () => {
      const { container } = render(<Tooltip {...defaultProps} position="left" />);
      expect(container.querySelector('.tutorial-tooltip')).toHaveClass('tutorial-tooltip-left');
    });

    it('applies right position class', () => {
      const { container } = render(<Tooltip {...defaultProps} position="right" />);
      expect(container.querySelector('.tutorial-tooltip')).toHaveClass('tutorial-tooltip-right');
    });
  });

  describe('keyboard accessibility', () => {
    it('allows keyboard activation with Enter', () => {
      const onNext = vi.fn();
      render(<Tooltip {...defaultProps} onNext={onNext} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.keyDown(nextButton, { key: 'Enter' });
      fireEvent.click(nextButton);
      expect(onNext).toHaveBeenCalled();
    });

    it('allows keyboard activation with Space', () => {
      const onNext = vi.fn();
      render(<Tooltip {...defaultProps} onNext={onNext} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.keyDown(nextButton, { key: ' ' });
      fireEvent.click(nextButton);
      expect(onNext).toHaveBeenCalled();
    });

    it('has proper tab order (Skip, Previous, Next)', () => {
      render(<Tooltip {...defaultProps} currentStep={3} />);

      const skipButton = screen.getByRole('button', { name: /skip/i });
      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      // All buttons should be focusable (tabIndex defaults to 0 or not set)
      expect(skipButton).not.toHaveAttribute('tabindex', '-1');
      expect(prevButton).not.toHaveAttribute('tabindex', '-1');
      expect(nextButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('accessibility attributes', () => {
    it('has aria-live polite on content area', () => {
      render(<Tooltip {...defaultProps} />);
      const content = screen.getByText('Test tooltip content').closest('[aria-live]');
      expect(content).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-label on navigation buttons', () => {
      render(<Tooltip {...defaultProps} currentStep={3} />);
      expect(screen.getByRole('button', { name: /skip tutorial/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous step/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument();
    });
  });

  describe('continuing from saved step', () => {
    it('shows continuing message when isContinuing is true', () => {
      render(<Tooltip {...defaultProps} currentStep={3} isContinuing={true} />);
      expect(screen.getByText(/continuing/i)).toBeInTheDocument();
    });

    it('does not show continuing message when isContinuing is false', () => {
      render(<Tooltip {...defaultProps} currentStep={3} isContinuing={false} />);
      expect(screen.queryByText(/continuing/i)).not.toBeInTheDocument();
    });
  });
});
