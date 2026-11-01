import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Overlay.module.css';

export type OverlayProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
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
