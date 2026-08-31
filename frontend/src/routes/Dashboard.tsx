import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/client';

interface Enrollment {
  id: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  course: { id: string; title: string };
}

export function Dashboard() {
  const { t } = useTranslation();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    apiFetch<Enrollment[]>('/enrollments/me').then(setEnrollments);
  }, []);

  return (
    <div>
      <h1>{t('dashboard.myCourses')}</h1>
      <ul>
        {enrollments.map((e) => (
          <li key={e.id}>
            <Link to={`/course/${e.course.id}?enrollmentId=${e.id}`}>{e.course.title}</Link>
            {' — '}
            {t(`dashboard.status.${e.status}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}
