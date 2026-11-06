import { LoadingSpinner } from '@meridiani/components';
import type { ReactNode } from 'react';
import styles from './AppLoadingSpinner.module.css';

type AppLoadingSpinnerProps = {
  label: ReactNode;
  size?: 'small' | 'large';
};

const AppLoadingSpinner = ({
  label,
  size = 'small',
}: AppLoadingSpinnerProps) => (
  <div className={`${styles.loading} ${styles[size]}`} role="status">
    <LoadingSpinner className={styles.indicator} aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export default AppLoadingSpinner;
