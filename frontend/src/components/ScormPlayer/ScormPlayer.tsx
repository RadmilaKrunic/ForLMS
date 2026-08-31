import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../api/client';
import { Scorm12Api } from './scormApi';

declare global {
  interface Window {
    API?: Scorm12Api;
  }
}

interface LaunchInfo {
  version: number;
  entryPoint: string;
  courseId: string;
}

/**
 * Hosts a SCORM 1.2 package for a given enrollment: exposes `window.API`
 * (read by the package's own SCORM wrapper JS) and loads the package's
 * entry-point HTML into an iframe served from the backend's /content
 * static route (ELR_LMS_003/004).
 */
export function ScormPlayer({ courseId, enrollmentId }: { courseId: string; enrollmentId: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [launch, setLaunch] = useState<LaunchInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const info = await apiFetch<LaunchInfo>(`/courses/${courseId}/scorm-package/launch-info`);
      const api = new Scorm12Api(enrollmentId);
      await api.preload();
      if (cancelled) return;
      window.API = api;
      setLaunch(info);
    }

    setup();
    return () => {
      cancelled = true;
      delete window.API;
    };
  }, [courseId, enrollmentId]);

  if (!launch) return <p>Учитавање курса…</p>;

  const contentUrl = `/content/${courseId}/${launch.version}/${launch.entryPoint}`;
  return (
    <iframe
      ref={iframeRef}
      title="scorm-content"
      src={contentUrl}
      style={{ width: '100%', height: '80vh', border: 'none' }}
    />
  );
}
