import type { ComponentProps } from 'react';
import styles from './LoadingSpinner.module.css';

type DivProps = Omit<ComponentProps<'div'>, 'children'>;

export type LoadingSpinnerProps = DivProps;

const LoadingSpinner = ({ className, ...rest }: LoadingSpinnerProps) => (
  <div {...rest} className={[styles['loading-spinner'], className].filter(Boolean).join(' ')}>
    <span className={styles['loading-spinner__indicator']} />
  </div>
);

export default LoadingSpinner;
