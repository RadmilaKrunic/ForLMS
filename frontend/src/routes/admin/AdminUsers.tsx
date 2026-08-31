import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  authSource: 'LDAP' | 'LOCAL';
  isActive: boolean;
  roles: { role: { name: string } }[];
}

/** ELR_LMS_005: admin user management console. */
export function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    apiFetch<AdminUser[]>('/users').then(setUsers);
  }, []);

  return (
    <div>
      <h1>{t('admin.users.title')}</h1>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Name</th>
            <th>Source</th>
            <th>Roles</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.displayName}</td>
              <td>{u.authSource}</td>
              <td>{u.roles.map((r) => r.role.name).join(', ')}</td>
              <td>{u.isActive ? '✓' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
