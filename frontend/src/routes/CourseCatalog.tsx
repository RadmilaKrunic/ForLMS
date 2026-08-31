import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/client';

interface Course {
  id: string;
  title: string;
  description?: string;
}

export function CourseCatalog() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    apiFetch<Course[]>('/courses').then(setCourses);
  }, []);

  return (
    <div>
      <h1>{t('catalog.title')}</h1>
      {courses.length === 0 && <p>{t('catalog.empty')}</p>}
      <ul>
        {courses.map((c) => (
          <li key={c.id}>
            <strong>{c.title}</strong>
            {c.description && <p>{c.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
