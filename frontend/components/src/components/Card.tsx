import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export type CardProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> & {
  children: ReactNode;
};

const Card = ({ children, className = '', ...buttonProps }: CardProps) => (
  <button {...buttonProps} className={`${styles.card} ${className}`.trim()} type="button">
    {children}
  </button>
);

export default Card;
