import { describe, expect, it } from 'vitest';
import {
  getCreatedAt,
  getJobDisplayName,
  getUpdatedAt,
  isValidJobTypeName,
  parseJsonObject,
  parseStringArray,
} from './model';

describe('model helpers', () => {
  const job = {
    id: 'job-1',
    job_type: 'rnaseq',
    current_status: 'COMPLETE',
    metadata: {
      sample: 'sample-1',
    },
    status_history: {
      '2026-01-01T02:00:00Z': 'COMPLETE',
      '2026-01-01T00:00:00Z': 'UNSCHEDULED',
    },
  };

  it('derives job display and timestamps', () => {
    expect(getJobDisplayName(job)).toBe('sample-1');
    expect(getCreatedAt(job)).toBe('2026-01-01T00:00:00Z');
    expect(getUpdatedAt(job)).toBe('2026-01-01T02:00:00Z');
  });

  it('validates JSON fields', () => {
    expect(parseJsonObject('{"project":"demo"}', 'Metadata')).toEqual({ project: 'demo' });
    expect(parseStringArray('["/bin/bash","-c"]', 'Command')).toEqual(['/bin/bash', '-c']);
    expect(() => parseJsonObject('[]', 'Metadata')).toThrow('Metadata must be a JSON object.');
    expect(() => parseStringArray('["ok", 1]', 'Command')).toThrow(
      'Command must be a JSON array of strings.'
    );
  });

  it('validates Kubernetes-safe job type names', () => {
    expect(isValidJobTypeName('rna-seq')).toBe(true);
    expect(isValidJobTypeName('RNA_seq')).toBe(false);
    expect(isValidJobTypeName(`a${'b'.repeat(57)}`)).toBe(false);
  });
});
