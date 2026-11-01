import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Overlay.module.css';
import type { WithoutAria } from './types';

export type OverlayProps = WithoutAria<Omit<HTMLAttributes<HTMLDivElement>, 'children'>> & {
  isOpen?: boolean;
  blur?: boolean;
  children?: ReactNode;
};

const Overlay = ({ isOpen = true, blur = false, className = '', children, ...rest }: OverlayProps) => (
  <div
    {...rest}
    className={[className, blur && styles.blurred, !isOpen && styles.closed].filter(Boolean).join(' ')}
  >
    {children}
  </div>
);

export default Overlay;
