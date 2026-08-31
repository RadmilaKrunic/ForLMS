import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { setLocale, SUPPORTED_LOCALES, SupportedLocale } from '../../i18n';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout, hasRole } = useAuth();

  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', borderBottom: '1px solid #ddd' }}>
      <strong>{t('app.title')}</strong>
      <Link to="/dashboard">{t('nav.dashboard')}</Link>
      <Link to="/catalog">{t('nav.catalog')}</Link>
      {hasRole('Administrator', 'ContentManager') && (
        <>
          <Link to="/admin/users">{t('nav.admin.users')}</Link>
          <Link to="/admin/courses">{t('nav.admin.courses')}</Link>
          <Link to="/admin/reports">{t('nav.admin.reports')}</Link>
        </>
      )}
      <span style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
        <select
          value={i18n.language}
          onChange={(e) => setLocale(e.target.value as SupportedLocale)}
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {locale}
            </option>
          ))}
        </select>
        {user && (
          <>
            <span>{user.displayName}</span>
            <button onClick={logout}>{t('nav.logout')}</button>
          </>
        )}
      </span>
    </nav>
  );
}
