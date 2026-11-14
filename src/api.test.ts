import { describe, expect, it, vi } from 'vitest';
import { AhabApiClient, AhabApiError, normalizeApiRoot } from './api';

describe('normalizeApiRoot', () => {
  it('adds the API path to a Function App URL', () => {
    expect(normalizeApiRoot('https://example.test')).toBe('https://example.test/api');
  });

  it('removes endpoint paths after the API segment', () => {
    expect(normalizeApiRoot('https://example.test/workspace/api/job?code=secret')).toBe(
      'https://example.test/workspace/api'
    );
  });
});

describe('AhabApiClient', () => {
  it('sends the Function key and parses jobs', async () => {
    const fetchImplementation = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('https://example.test/api/job');
      expect(init?.method ?? 'GET').toBe('GET');
      expect(new Headers(init?.headers).get('x-functions-key')).toBe('secret');
      return new Response(
        JSON.stringify({
          message: '1 job found',
          jobs: [{ id: 'job-1', job_type: 'wgs', current_status: 'COMPLETE', outputs: { results: '/mnt/results' } }],
        }),
        { status: 200 }
      );
    });
    const client = new AhabApiClient(
      'https://example.test',
      'secret',
      fetchImplementation as typeof fetch
    );

    await expect(client.listJobs()).resolves.toHaveLength(1);
  });

  it('lists job templates without requesting a worker claim', async () => {
    const fetchImplementation = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('https://example.test/api/job_template');
      expect(init?.method ?? 'GET').toBe('GET');
      return new Response(JSON.stringify({ message: '1 job template(s) found.', job_templates: [{ name: 'wgs' }] }));
    });
    const client = new AhabApiClient('https://example.test', 'secret', fetchImplementation as typeof fetch);
    await expect(client.listJobTypes()).resolves.toEqual([{ name: 'wgs' }]);
  });

  it('creates a job with the API job_type, metadata and inputs fields', async () => {
    const job = { job_type: 'wgs', metadata: { sample: 'A-B' }, inputs: { inputdir: '/mnt/data', outdir: '/mnt/results' } };
    const fetchImplementation = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('https://example.test/api/job');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(String(init?.body))).toEqual(job);
      return new Response(JSON.stringify({ message: 'Job created successfully.', id: 'job-1', job_type: 'wgs' }));
    });
    const client = new AhabApiClient('https://example.test', 'secret', fetchImplementation as typeof fetch);
    await expect(client.createJob(job)).resolves.toMatchObject({ id: 'job-1', job_type: 'wgs' });
  });

  it('updates status in query parameters and outputs in the JSON body', async () => {
    const fetchImplementation = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      expect(url.pathname).toBe('/api/job');
      expect(url.searchParams.get('id')).toBe('job-1');
      expect(url.searchParams.get('status')).toBe('COMPLETE');
      expect(init?.method).toBe('PUT');
      expect(JSON.parse(String(init?.body))).toEqual({ outputs: { results: '/mnt/results' } });
      return new Response(JSON.stringify({ message: 'Job updated successfully.', id: 'job-1', status: 'COMPLETE' }));
    });
    const client = new AhabApiClient('https://example.test', 'secret', fetchImplementation as typeof fetch);
    await expect(client.updateJob('job-1', { status: 'COMPLETE', updates: { outputs: { results: '/mnt/results' } } })).resolves.toMatchObject({ status: 'COMPLETE' });
  });

  it('returns API error details', async () => {
    const fetchImplementation = vi.fn(async () => {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    });
    const client = new AhabApiClient(
      'https://example.test',
      '',
      fetchImplementation as typeof fetch
    );

    await expect(client.listJobs()).rejects.toEqual(
      expect.objectContaining<AhabApiError>({
        message: expect.stringContaining('Unauthorized'),
        name: 'AhabApiError',
        status: 401,
      })
    );
  });
});
