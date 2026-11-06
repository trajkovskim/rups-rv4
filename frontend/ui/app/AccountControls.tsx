import type { AuthUser } from '@/api/types';
import { gameText } from './gameText';
import styles from './page.module.css';

type AccountControlsProps = {
  user: AuthUser | null;
  onLogin: () => void;
  onLogout: () => void;
};

const UserIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1.2-4 4-6 7.5-6s6.3 2 7.5 6" />
  </svg>
);

function AccountControls({ user, onLogin, onLogout }: AccountControlsProps) {
  if (!user) {
    return (
      <button type="button" className={styles.account} onClick={onLogin}>
        <UserIcon />
        {gameText.auth.openLabel}
      </button>
    );
  }

  return (
    <div className={styles.account}>
      <UserIcon />
      <span className={styles.accountName}>{user.username}</span>
      <button type="button" className={styles.logout} onClick={onLogout}>
        {gameText.auth.logoutLabel}
      </button>
    </div>
  );
}

export default AccountControls;
