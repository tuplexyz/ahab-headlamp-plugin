import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AhabJob, AhabJobType } from '../types';
import { CreateJobDialog, JobTypeDialog } from './JobDialogs';
import { JobsTable, JobTypesTable } from './JobTables';

const job: AhabJob = {
  id: 'job-123',
  job_type: 'rnaseq',
  current_status: 'FAILED',
  status_history: { '2026-11-11T12:00:00Z': 'FAILED' },
  metadata: { sample: 'sample-1' },
  inputs: { reference: '/mnt/reference' },
  outputs: { result: '/mnt/result' },
};
const template: AhabJobType = {
  name: 'rnaseq',
  pool_name: 'rnaseq',
  image: 'example/worker:v1',
  cpu: 1,
  memory: '2Gi',
  max_nodes: 20,
  vm_size: 'Standard_D4s_v3',
  command: ['/bin/bash'],
  args: ['./run.sh'],
};

afterEach(cleanup);

describe('table detail modals', () => {
  it('opens complete job details from a row, including dashboard tables', () => {
    render(<JobsTable jobs={[job]} limit={10} />);
    fireEvent.click(screen.getByRole('button', { name: 'View job job-123' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('/mnt/reference');
    expect(dialog.textContent).toContain('/mnt/result');
    expect(dialog.textContent).toContain('status_history');
    expect(dialog.textContent).toContain('sample-1');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
  });

  it.each(['Enter', ' '])('opens template details with the %s key', key => {
    render(<JobTypesTable jobTypes={[template]} onEdit={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'View job template rnaseq' }), { key });
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('./run.sh');
    expect(dialog.textContent).toContain('Standard_D4s_v3');
  });

  it('keeps update and edit actions separate from viewing details', () => {
    const editJob = vi.fn();
    const editTemplate = vi.fn();
    render(
      <>
        <JobsTable jobs={[job]} onEdit={editJob} />
        <JobTypesTable jobTypes={[template]} onEdit={editTemplate} />
      </>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(editJob).toHaveBeenCalledWith(job);
    expect(editTemplate).toHaveBeenCalledWith(template);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('job template creation', () => {
  it('formats the brand in a job submission error', async () => {
    render(
      <CreateJobDialog
        open
        jobTypes={[template]}
        onClose={vi.fn()}
        onSubmit={vi.fn().mockRejectedValue(new Error('Ahab API is not configured.'))}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('ahab API is not configured.');
    expect(within(alert).getByText('ahab').style.fontFamily).toContain('Righteous');
  });

  it('submits a new template using infrastructure-managed pool settings', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<JobTypeDialog open poolOptions={[template]} onClose={vi.fn()} onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'new-rnaseq' } });
    fireEvent.change(screen.getByLabelText(/^Container image/), {
      target: { value: 'example/new:v2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await vi.waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit).toHaveBeenCalledWith({
      name: 'new-rnaseq',
      pool_name: 'rnaseq',
      image: 'example/new:v2',
      max_nodes: 20,
      vm_size: 'Standard_D4s_v3',
      memory: '2Gi',
      cpu: 1,
      command: ['/bin/bash', '-c'],
      args: [],
    });
  });

  it('keeps the form open and shows API creation errors', async () => {
    const close = vi.fn();
    const submit = vi.fn().mockRejectedValue(new Error('Template already exists'));
    render(<JobTypeDialog open poolOptions={[template]} onClose={close} onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'rnaseq' } });
    fireEvent.change(screen.getByLabelText(/^Container image/), {
      target: { value: template.image },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Template already exists'
    );
    expect(close).not.toHaveBeenCalled();
  });
});
