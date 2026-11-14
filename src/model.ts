import { AhabJob } from './types';

export const JOB_STATUSES = [
  'UNSCHEDULED',
  'PENDING',
  'STARTED',
  'COMPLETE',
  'FAILED',
] as const;

export const TERMINAL_JOB_STATUSES = new Set(['COMPLETE', 'COMPLETED', 'FAILED']);
const JOB_TYPE_NAME_PATTERN = /^[a-z0-9](?:[-a-z0-9]{0,55}[a-z0-9])?$/;

export function isValidJobTypeName(value: string): boolean {
  return JOB_TYPE_NAME_PATTERN.test(value);
}

export function parseJsonObject(value: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value || '{}');
  } catch (error) {
    throw new Error(`${label} must contain valid JSON.`);
  }

  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error(`${label} must be a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}

export function parseStringArray(value: string, label: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value || '[]');
  } catch (error) {
    throw new Error(`${label} must contain valid JSON.`);
  }

  if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'string')) {
    throw new Error(`${label} must be a JSON array of strings.`);
  }
  return parsed;
}

export function getStatusHistory(job: AhabJob): Array<[string, string]> {
  if (!job.status_history || typeof job.status_history !== 'object') {
    return [];
  }

  return Object.entries(job.status_history).sort(
    ([left], [right]) => Date.parse(left) - Date.parse(right)
  );
}

export function getCreatedAt(job: AhabJob): string | undefined {
  return getStatusHistory(job)[0]?.[0];
}

export function getUpdatedAt(job: AhabJob): string | undefined {
  const history = getStatusHistory(job);
  return history[history.length - 1]?.[0];
}

export function getJobDisplayName(job: AhabJob): string {
  const metadata = job.metadata;
  if (metadata && typeof metadata === 'object') {
    for (const key of ['sample', 'name', 'project']) {
      const value = metadata[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }
  }
  return job.id;
}

export function formatTimestamp(value?: string): string {
  if (!value) {
    return '-';
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export function sortJobsByUpdatedAt(jobs: AhabJob[]): AhabJob[] {
  return [...jobs].sort(
    (left, right) =>
      Date.parse(getUpdatedAt(right) ?? '') - Date.parse(getUpdatedAt(left) ?? '')
  );
}
