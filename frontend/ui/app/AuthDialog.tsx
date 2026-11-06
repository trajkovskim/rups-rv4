'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Modal } from '@meridiani/components';
import { ApiError } from '@/api/api';
import type { LoginData, RegistrationData } from '@/api/types';
import { gameText } from './gameText';
import styles from './AuthDialog.module.css';

const text = gameText.auth;

// Enaka pravila kot v backendu, da učenec napako vidi takoj
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[\p{L}\p{N}_.-]{3,50}$/u;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

type Mode = 'login' | 'register';
type Field = 'email' | 'username' | 'password';
type FieldErrors = Partial<Record<Field, string>>;

const validate = (mode: Mode, email: string, username: string, password: string) => {
  const errors: FieldErrors = {};
  if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = text.errors.email;
  }
  if (mode === 'login') {
    if (!password) errors.password = text.errors.passwordRequired;
    return errors;
  }
  if (!USERNAME_PATTERN.test(username.trim())) {
    errors.username = text.errors.username;
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    errors.password = text.errors.passwordLength;
  }
  return errors;
};

type AuthDialogProps = {
  onClose: () => void;
  onLogin: (data: LoginData) => Promise<void>;
  onRegister: (data: RegistrationData) => Promise<void>;
};

function AuthDialog({ onClose, onLogin, onRegister }: AuthDialogProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const content = text[mode];
  const titleId = `${id}-title`;

  useEffect(() => {
    emailRef.current?.focus();
  }, [mode]);

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFieldErrors({});
    setFormError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const errors = validate(mode, email, username, password);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await onLogin({ email, password });
      } else {
        await onRegister({ email, username, password });
      }
      onClose();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : text.errors.unavailable);
      setIsSubmitting(false);
    }
  };

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  };

  const fieldProps = (field: Field) => ({
    id: `${id}-${field}`,
    className: styles.input,
    'aria-invalid': fieldErrors[field] !== undefined,
    'aria-describedby': fieldErrors[field] ? `${id}-${field}-error` : undefined,
  });

  const fieldError = (field: Field) =>
    fieldErrors[field] && (
      <p id={`${id}-${field}-error`} className={styles.fieldError}>
        {fieldErrors[field]}
      </p>
    );

  return (
    <Modal isOpen className={styles.dialog}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={closeOnEscape}>
        <button type="button" className={styles.close} aria-label={text.closeLabel} onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <p className={styles.eyebrow}>{text.eyebrow}</p>
        <h1 id={titleId} className={styles.title}>
          {content.title}
        </h1>
        <p className={styles.description}>{content.description}</p>

        <form className={styles.form} noValidate onSubmit={(event) => void submit(event)}>
          <div className={styles.field}>
            <label htmlFor={`${id}-email`}>{text.emailLabel}</label>
            <input
              {...fieldProps('email')}
              ref={emailRef}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {fieldError('email')}
          </div>

          {mode === 'register' && (
            <div className={styles.field}>
              <label htmlFor={`${id}-username`}>{text.usernameLabel}</label>
              <input
                {...fieldProps('username')}
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
              {fieldError('username')}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor={`${id}-password`}>{text.passwordLabel}</label>
            <div className={styles.passwordInput}>
              <input
                {...fieldProps('password')}
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className={styles.reveal}
                aria-label={isPasswordVisible ? text.hidePassword : text.showPassword}
                aria-pressed={isPasswordVisible}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {isPasswordVisible && <path d="M4 4l16 16" />}
                </svg>
              </button>
            </div>
            {fieldError('password') ??
              (mode === 'register' && <p className={styles.hint}>{text.passwordHint}</p>)}
          </div>

          {formError && (
            <p className={styles.formError} role="alert">
              {formError}
            </p>
          )}

          <button type="submit" className={styles.submit} disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting && <span className={styles.spinner} aria-hidden="true" />}
            {content.submit}
          </button>
        </form>

        <p className={styles.switch}>
          {content.switchQuestion}{' '}
          <button type="button" onClick={switchMode}>
            {content.switchAction}
          </button>
        </p>
      </div>
    </Modal>
  );
}

export default AuthDialog;
