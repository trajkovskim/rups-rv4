import type { HTMLAttributes, ReactNode } from 'react';
import styles from './FloatingPanel.module.css';
import type { WithoutAria } from './types';

export type FloatingPanelPosition = 'top-left' | 'top-right' | 'bottom-center' | 'bottom-right';

export type FloatingPanelProps = WithoutAria<Omit<HTMLAttributes<HTMLDivElement>, 'children'>> & {
  children: ReactNode;
  position: FloatingPanelPosition;
  mobilePosition?: FloatingPanelPosition;
  priority?: 'normal' | 'high';
  size?: 'content' | 'wide';
};

const positionStyles: Record<FloatingPanelPosition, string> = {
  'top-left': styles.topLeft,
  'top-right': styles.topRight,
  'bottom-center': styles.bottomCenter,
  'bottom-right': styles.bottomRight,
};

const mobilePositionStyles: Record<FloatingPanelPosition, string> = {
  'top-left': styles.mobileTopLeft,
  'top-right': styles.mobileTopRight,
  'bottom-center': styles.mobileBottomCenter,
  'bottom-right': styles.mobileBottomRight,
};

const FloatingPanel = ({
  children,
  className = '',
  position,
  mobilePosition,
  priority = 'normal',
  size = 'content',
  ...rest
}: FloatingPanelProps) => (
  <div
    {...rest}
    className={[
      styles.panel,
      priority === 'high' && styles.highPriority,
      size === 'wide' && styles.wide,
      positionStyles[position],
      mobilePosition && mobilePositionStyles[mobilePosition],
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </div>
);

export default FloatingPanel;
