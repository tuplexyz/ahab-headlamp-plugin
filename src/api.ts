import {
  AhabJob,
  AhabJobType,
  CreateJobRequest,
  JobListResponse,
  JobTypeListResponse,
  MutationResponse,
  UpdateJobRequest,
} from './types';

export type FetchImplementation = typeof fetch;

export class AhabApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AhabApiError';
    this.status = status;
  }
}

export function normalizeApiRoot(value: string): string {
  const candidate = value.trim();
  if (!candidate) {
    throw new Error('API URL is required.');
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch (error) {
    throw new Error('API URL must be an absolute HTTP or HTTPS URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('API URL must use HTTP or HTTPS.');
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const apiIndex = segments.indexOf('api');
  url.pathname =
    apiIndex >= 0 ? `/${segments.slice(0, apiIndex + 1).join('/')}` : `${url.pathname.replace(/\/$/, '')}/api`;
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

export class AhabApiClient {
  readonly apiRoot: string;
  private readonly apiKey: string;
  private readonly fetchImplementation: FetchImplementation;

  constructor(apiUrl: string, apiKey = '', fetchImplementation: FetchImplementation = fetch) {
    this.apiRoot = normalizeApiRoot(apiUrl);
    this.apiKey = apiKey.trim();
    this.fetchImplementation = fetchImplementation;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    query?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.apiRoot}/${path.replace(/^\//, '')}`);
    for (const [name, value] of Object.entries(query ?? {})) {
      url.searchParams.set(name, value);
    }

    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.apiKey) {
      headers.set('x-functions-key', this.apiKey);
    }

    let response: Response;
    try {
      response = await this.fetchImplementation(url, {
        ...init,
        headers,
        mode: 'cors',
        credentials: 'omit',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new AhabApiError(`Unable to reach the Ahab API: ${message}`);
    }

    const text = await response.text();
    let payload: unknown = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        if (response.ok) {
          throw new AhabApiError('The Ahab API returned an invalid JSON response.');
        }
      }
    }

    if (!response.ok) {
      const message =
        payload && typeof payload === 'object' && 'message' in payload
          ? String((payload as { message: unknown }).message)
          : response.statusText;
      throw new AhabApiError(
        `Ahab API request failed (${response.status}): ${message || 'Unknown error'}`,
        response.status
      );
    }
    return payload as T;
  }

  async listJobs(): Promise<AhabJob[]> {
    const response = await this.request<JobListResponse>('job');
    if (!Array.isArray(response.jobs)) {
      throw new AhabApiError('The Ahab API response did not include a jobs list.');
    }
    return response.jobs;
  }

  async createJob(request: CreateJobRequest): Promise<MutationResponse> {
    return this.request<MutationResponse>('job', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateJob(id: string, request: UpdateJobRequest): Promise<MutationResponse> {
    return this.request<MutationResponse>(
      'job',
      {
        method: 'PUT',
        body: JSON.stringify(request.updates ?? {}),
      },
      {
        id,
        status: request.status,
      }
    );
  }

  async listJobTypes(): Promise<AhabJobType[]> {
    const response = await this.request<JobTypeListResponse>('job_template');
    if (!Array.isArray(response.job_templates)) {
      throw new AhabApiError('The Ahab API response did not include a job types list.');
    }
    return response.job_templates;
  }

  async createJobType(jobType: AhabJobType): Promise<MutationResponse> {
    return this.request<MutationResponse>('job_template', {
      method: 'POST',
      body: JSON.stringify(jobType),
    });
  }

  async updateJobType(jobType: AhabJobType): Promise<MutationResponse> {
    return this.request<MutationResponse>('job_template', {
      method: 'PUT',
      body: JSON.stringify(jobType),
    });
  }
}
