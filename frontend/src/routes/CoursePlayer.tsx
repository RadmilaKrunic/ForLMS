import { useParams, useSearchParams } from 'react-router-dom';
import { ScormPlayer } from '../components/ScormPlayer/ScormPlayer';

export function CoursePlayer() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const enrollmentId = searchParams.get('enrollmentId');

  if (!courseId || !enrollmentId) return <p>Missing course or enrollment.</p>;

  return <ScormPlayer courseId={courseId} enrollmentId={enrollmentId} />;
}
