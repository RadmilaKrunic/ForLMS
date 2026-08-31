import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch, getToken } from '../../api/client';

interface Course {
  id: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

/** ELR_LMS_008: self-service course + SCORM package management. */
export function AdminCourses() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState('');

  async function refresh() {
    setCourses(await apiFetch<Course[]>('/courses/all'));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createCourse(e: FormEvent) {
    e.preventDefault();
    await apiFetch('/courses', { method: 'POST', body: JSON.stringify({ title }) });
    setTitle('');
    refresh();
  }

  async function uploadPackage(courseId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    await fetch(`/api/courses/${courseId}/scorm-package`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    refresh();
  }

  return (
    <div>
      <h1>{t('admin.courses.title')}</h1>
      <form onSubmit={createCourse}>
        <input placeholder="Course title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <button type="submit">+ Course</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>{t('admin.courses.upload')}</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.id}>
              <td>{c.title}</td>
              <td>{c.status}</td>
              <td>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => e.target.files?.[0] && uploadPackage(c.id, e.target.files[0])}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
