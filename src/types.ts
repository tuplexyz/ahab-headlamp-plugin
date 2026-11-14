export interface AhabJob {
  id: string;
  job_type: string;
  current_status: string;
  status_history?: Record<string, string>;
  metadata?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  image?: string;
  [key: string]: unknown;
}

export interface AhabJobType {
  id?: string;
  name: string;
  pool_name: string;
  image: string;
  max_nodes: number;
  vm_size: string;
  memory: string;
  cpu: number;
  command: string[];
  args?: string[] | null;
  [key: string]: unknown;
}

export interface CreateJobRequest {
  job_type: string;
  metadata: Record<string, unknown>;
  inputs: Record<string, unknown>;
}

export interface UpdateJobRequest {
  status: string;
  updates?: Record<string, unknown>;
}

export interface JobListResponse {
  message: string;
  jobs: AhabJob[];
}

export interface JobTypeListResponse {
  message: string;
  job_templates: AhabJobType[];
}

export interface MutationResponse {
  message: string;
  id?: string;
  name?: string;
  job_type?: string;
  status?: string;
}
