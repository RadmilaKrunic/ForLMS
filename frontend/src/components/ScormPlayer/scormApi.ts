import { apiFetch } from '../../api/client';

/**
 * SCORM 1.2 Run-Time Environment API adapter. SCORM packages discover this
 * by walking up the browser window/frame hierarchy looking for an object
 * named `API` with these exact method names — see ELR_LMS_003.
 *
 * State is buffered locally per SCORM's element-by-element GetValue/SetValue
 * model, and flushed to the backend as one CMI document on LMSCommit /
 * LMSFinish (ScormService.commit).
 */
export class Scorm12Api {
  private cmi: Record<string, string> = {};
  private lastError = '0';
  private initialized = false;

  constructor(private readonly enrollmentId: string) {}

  async preload(): Promise<void> {
    const data = await apiFetch<Record<string, string>>(`/scorm/enrollments/${this.enrollmentId}/initialize`, {
      method: 'POST',
    });
    this.cmi = { ...data };
  }

  LMSInitialize = (_param: string): string => {
    this.initialized = true;
    this.lastError = '0';
    return 'true';
  };

  LMSFinish = (_param: string): string => {
    this.flush('Terminate');
    this.initialized = false;
    this.lastError = '0';
    return 'true';
  };

  LMSGetValue = (element: string): string => {
    if (!this.initialized) {
      this.lastError = '301';
      return '';
    }
    this.lastError = '0';
    return this.cmi[element] ?? '';
  };

  LMSSetValue = (element: string, value: string): string => {
    if (!this.initialized) {
      this.lastError = '301';
      return 'false';
    }
    this.cmi[element] = value;
    this.lastError = '0';
    return 'true';
  };

  LMSCommit = (_param: string): string => {
    this.flush('Commit');
    return 'true';
  };

  LMSGetLastError = (): string => this.lastError;

  LMSGetErrorString = (errorCode: string): string => SCORM_ERROR_STRINGS[errorCode] ?? 'Unknown error';

  LMSGetDiagnostic = (errorCode: string): string => SCORM_ERROR_STRINGS[errorCode] ?? '';

  private flush(_reason: 'Commit' | 'Terminate') {
    void apiFetch(`/scorm/enrollments/${this.enrollmentId}/commit`, {
      method: 'POST',
      body: JSON.stringify({
        cmiData: this.cmi,
        lessonStatus: this.cmi['cmi.core.lesson_status'],
        scoreRaw: this.cmi['cmi.core.score.raw'] ? Number(this.cmi['cmi.core.score.raw']) : undefined,
        sessionTime: this.cmi['cmi.core.session_time'],
        suspendData: this.cmi['cmi.suspend_data'],
      }),
    });
  }
}

const SCORM_ERROR_STRINGS: Record<string, string> = {
  '0': 'No error',
  '101': 'General exception',
  '201': 'Invalid argument error',
  '301': 'Not initialized',
  '401': 'Not implemented error',
};
