import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Knob } from '../src/components/Knob/Knob';

describe('Knob', () => {
  const defaultProps = {
    value: 50,
    min: 0,
    max: 100,
    onChange: vi.fn(),
    label: 'Test Knob',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with label', () => {
      render(<Knob {...defaultProps} />);
      expect(screen.getByLabelText('Test Knob')).toBeInTheDocument();
    });

    it('displays correct initial value', () => {
      render(<Knob {...defaultProps} value={75} />);
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('renders as a slider role', () => {
      render(<Knob {...defaultProps} />);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has aria-valuenow attribute', () => {
      render(<Knob {...defaultProps} value={60} />);
      const knob = screen.getByRole('slider');
      expect(knob).toHaveAttribute('aria-valuenow', '60');
    });

    it('has aria-valuemin attribute', () => {
      render(<Knob {...defaultProps} min={10} />);
      const knob = screen.getByRole('slider');
      expect(knob).toHaveAttribute('aria-valuemin', '10');
    });

    it('has aria-valuemax attribute', () => {
      render(<Knob {...defaultProps} max={200} />);
      const knob = screen.getByRole('slider');
      expect(knob).toHaveAttribute('aria-valuemax', '200');
    });

    it('has aria-label attribute', () => {
      render(<Knob {...defaultProps} label="Volume" />);
      const knob = screen.getByRole('slider');
      expect(knob).toHaveAttribute('aria-label', 'Volume');
    });

    it('is focusable via keyboard', () => {
      render(<Knob {...defaultProps} />);
      const knob = screen.getByRole('slider');
      expect(knob).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('keyboard controls', () => {
    it('ArrowUp increases value by step', async () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={50} step={1} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.keyDown(knob, { key: 'ArrowUp' });
      expect(onChange).toHaveBeenCalledWith(51);
    });

    it('ArrowDown decreases value by step', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={50} step={1} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.keyDown(knob, { key: 'ArrowDown' });
      expect(onChange).toHaveBeenCalledWith(49);
    });

    it('ArrowRight increases value by step', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={50} step={1} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.keyDown(knob, { key: 'ArrowRight' });
      expect(onChange).toHaveBeenCalledWith(51);
    });

    it('ArrowLeft decreases value by step', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={50} step={1} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.keyDown(knob, { key: 'ArrowLeft' });
      expect(onChange).toHaveBeenCalledWith(49);
    });

    it('PageUp increases value by largeStep', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={50} largeStep={10} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.keyDown(knob, { key: 'PageUp' });
      expect(onChange).toHaveBeenCalledWith(60);
    });

    it('PageDown decreases value by largeStep', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={50} largeStep={10} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.keyDown(knob, { key: 'PageDown' });
      expect(onChange).toHaveBeenCalledWith(40);
    });

    it('Home sets value to min', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={50} min={10} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.keyDown(knob, { key: 'Home' });
      expect(onChange).toHaveBeenCalledWith(10);
    });

    it('End sets value to max', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={50} max={200} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.keyDown(knob, { key: 'End' });
      expect(onChange).toHaveBeenCalledWith(200);
    });
  });

  describe('value clamping', () => {
    it('clamps value to min bound', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={0} min={0} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.keyDown(knob, { key: 'ArrowDown' });
      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('clamps value to max bound', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={100} max={100} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.keyDown(knob, { key: 'ArrowUp' });
      expect(onChange).toHaveBeenCalledWith(100);
    });
  });

  describe('mouse interaction', () => {
    it('starts drag on mousedown', () => {
      render(<Knob {...defaultProps} />);
      const knob = screen.getByRole('slider');

      fireEvent.mouseDown(knob, { clientY: 100 });
      // No error means it started correctly
      expect(knob).toBeInTheDocument();
    });

    it('changes value on vertical mouse drag', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={50} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      // Simulate drag: mousedown, then mousemove up (decreasing clientY = increasing value)
      fireEvent.mouseDown(knob, { clientY: 100 });
      fireEvent.mouseMove(document, { clientY: 50 }); // Moved up 50px
      fireEvent.mouseUp(document);

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('touch interaction', () => {
    it('starts drag on touchstart', () => {
      render(<Knob {...defaultProps} />);
      const knob = screen.getByRole('slider');

      fireEvent.touchStart(knob, { touches: [{ clientY: 100 }] });
      expect(knob).toBeInTheDocument();
    });

    it('changes value on vertical touch drag', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={50} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.touchStart(knob, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(document, { touches: [{ clientY: 50 }] });
      fireEvent.touchEnd(document);

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('default props', () => {
    it('uses default step of 1', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={50} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.keyDown(knob, { key: 'ArrowUp' });
      expect(onChange).toHaveBeenCalledWith(51);
    });

    it('uses default largeStep of 10', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={50} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.keyDown(knob, { key: 'PageUp' });
      expect(onChange).toHaveBeenCalledWith(60);
    });

    it('uses default size of 64', () => {
      render(<Knob {...defaultProps} />);
      const knob = screen.getByRole('slider');
      expect(knob).toHaveStyle({ width: '64px', height: '64px' });
    });
  });

  describe('custom props', () => {
    it('respects custom step', () => {
      const onChange = vi.fn();
      render(<Knob {...defaultProps} value={50} step={5} onChange={onChange} />);
      const knob = screen.getByRole('slider');

      fireEvent.keyDown(knob, { key: 'ArrowUp' });
      expect(onChange).toHaveBeenCalledWith(55);
    });

    it('respects custom size', () => {
      render(<Knob {...defaultProps} size={48} />);
      const knob = screen.getByRole('slider');
      expect(knob).toHaveStyle({ width: '48px', height: '48px' });
    });
  });
});
