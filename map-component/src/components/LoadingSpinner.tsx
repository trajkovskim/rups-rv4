import type { ComponentProps } from 'react';
import styles from './LoadingSpinner.module.css';

type Props = ComponentProps<'div'> & {
  label?: string;
};

const LoadingSpinner = ({ label = 'Loading', className, ...rest }: Props) => (
  <div
    {...rest}
    className={[styles['loading-spinner'], className].filter(Boolean).join(' ')}
    role="status"
    aria-label={label}
  >
    <span className={styles['loading-spinner__indicator']} aria-hidden="true" />
  </div>
);

export default LoadingSpinner;
