import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';

interface Course {
  id: string;
  title: string;
}

interface CompletionRow {
  id: string;
  status: string;
  scoreRaw: number | null;
  user: { displayName: string };
}

/** ELR_LMS_006: basic completion/reporting for administrators. */
export function AdminReports() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [rows, setRows] = useState<CompletionRow[]>([]);

  useEffect(() => {
    apiFetch<Course[]>('/courses/all').then(setCourses);
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    apiFetch<CompletionRow[]>(`/reports/courses/${selectedCourseId}`).then(setRows);
  }, [selectedCourseId]);

  return (
    <div>
      <h1>{t('admin.reports.title')}</h1>
      <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
        <option value="">—</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      {selectedCourseId && (
        <>
          <a href={`/api/reports/courses/${selectedCourseId}/export.csv`}>Export CSV</a>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.user.displayName}</td>
                  <td>{r.status}</td>
                  <td>{r.scoreRaw ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
