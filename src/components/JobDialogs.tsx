import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import React from 'react';
import { isValidJobTypeName, JOB_STATUSES, parseJsonObject, parseStringArray } from '../model';
import { AhabJob, AhabJobType, CreateJobRequest, UpdateJobRequest } from '../types';
import { BrandText } from './BrandText';

export function RecordDetailsDialog({
  title,
  record,
  onClose,
}: {
  title: string;
  record: AhabJob | AhabJobType | null;
  onClose: () => void;
}) {
  const titleId = React.useId();
  return (
    <Dialog
      open={Boolean(record)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {JSON.stringify(record, null, 2)}
        </pre>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

interface CreateJobDialogProps {
  open: boolean;
  jobTypes: AhabJobType[];
  onClose: () => void;
  onSubmit: (request: CreateJobRequest) => Promise<void>;
}

export function CreateJobDialog({ open, jobTypes, onClose, onSubmit }: CreateJobDialogProps) {
  const [jobType, setJobType] = React.useState('');
  const [metadata, setMetadata] = React.useState('{\n  "project": "",\n  "sample": ""\n}');
  const [inputs, setInputs] = React.useState('{}');
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setJobType(jobTypes[0]?.name ?? '');
      setError('');
    }
  }, [jobTypes, open]);

  const submit = async () => {
    try {
      if (!jobType) {
        throw new Error('Select a job type.');
      }
      setSubmitting(true);
      await onSubmit({
        job_type: jobType,
        metadata: parseJsonObject(metadata, 'Metadata'),
        inputs: parseJsonObject(inputs, 'Inputs'),
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : String(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Create job</DialogTitle>
      <DialogContent>
        <Stack spacing={2} marginTop={1}>
          {error && <Alert severity="error"><BrandText text={error} /></Alert>}
          <FormControl fullWidth>
            <InputLabel id="ahab-job-type-label">Job type</InputLabel>
            <Select
              labelId="ahab-job-type-label"
              label="Job type"
              value={jobType}
              onChange={event => setJobType(event.target.value)}
            >
              {jobTypes.map(item => (
                <MenuItem key={item.name} value={item.name}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Metadata (JSON object)"
            value={metadata}
            onChange={event => setMetadata(event.target.value)}
            multiline
            minRows={5}
            fullWidth
          />
          <TextField
            label="Inputs (JSON object)"
            value={inputs}
            onChange={event => setInputs(event.target.value)}
            helperText="RNA-seq needs transcriptome, reads, and outdir. WGS needs outdir and accepts inputdir. Use a unique output directory for each job."
            multiline
            minRows={7}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={submitting} onClick={submit}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface UpdateJobDialogProps {
  job: AhabJob | null;
  onClose: () => void;
  onSubmit: (job: AhabJob, request: UpdateJobRequest) => Promise<void>;
}

export function UpdateJobDialog({ job, onClose, onSubmit }: UpdateJobDialogProps) {
  const [status, setStatus] = React.useState('COMPLETE');
  const [updates, setUpdates] = React.useState('{}');
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (job) {
      setStatus(job.current_status || 'COMPLETE');
      setUpdates(job.outputs ? JSON.stringify({ outputs: job.outputs }, null, 2) : '{}');
      setError('');
    }
  }, [job]);

  const submit = async () => {
    if (!job) {
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit(job, {
        status,
        updates: parseJsonObject(updates, 'Updates'),
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : String(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={Boolean(job)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Update job</DialogTitle>
      <DialogContent>
        <Stack spacing={2} marginTop={1}>
          {error && <Alert severity="error"><BrandText text={error} /></Alert>}
          <TextField label="Job ID" value={job?.id ?? ''} disabled fullWidth />
          <FormControl fullWidth>
            <InputLabel id="ahab-job-status-label">Status</InputLabel>
            <Select
              labelId="ahab-job-status-label"
              label="Status"
              value={status}
              onChange={event => setStatus(event.target.value)}
            >
              {JOB_STATUSES.map(item => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Additional updates (JSON object)"
            helperText='For example: {"outputs": {"bam": "/mnt/data/sample.bam"}}'
            value={updates}
            onChange={event => setUpdates(event.target.value)}
            multiline
            minRows={7}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={submitting} onClick={submit}>
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface JobTypeDialogProps {
  open: boolean;
  jobType?: AhabJobType | null;
  poolOptions: AhabJobType[];
  onClose: () => void;
  onSubmit: (jobType: AhabJobType) => Promise<void>;
}

export function JobTypeDialog({
  open,
  jobType,
  poolOptions,
  onClose,
  onSubmit,
}: JobTypeDialogProps) {
  const poolLabelId = React.useId();
  const pools = React.useMemo(() => {
    const uniquePools = new Map<string, AhabJobType>();
    for (const option of poolOptions) {
      if (!uniquePools.has(option.pool_name)) {
        uniquePools.set(option.pool_name, option);
      }
    }
    if (jobType && !uniquePools.has(jobType.pool_name)) {
      uniquePools.set(jobType.pool_name, jobType);
    }
    return [...uniquePools.values()].sort((left, right) =>
      left.pool_name.localeCompare(right.pool_name)
    );
  }, [jobType, poolOptions]);
  const [name, setName] = React.useState('');
  const [poolName, setPoolName] = React.useState('');
  const [image, setImage] = React.useState('');
  const [maxNodes, setMaxNodes] = React.useState('1');
  const [vmSize, setVmSize] = React.useState('Standard_D2_v2');
  const [memory, setMemory] = React.useState('2Gi');
  const [cpu, setCpu] = React.useState('1');
  const [command, setCommand] = React.useState('["/bin/bash", "-c"]');
  const [args, setArgs] = React.useState('[]');
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const initialPoolName = jobType?.pool_name ?? pools[0]?.pool_name ?? '';
    const initialPool = pools.find(pool => pool.pool_name === initialPoolName);
    setName(jobType?.name ?? '');
    setPoolName(initialPoolName);
    setImage(jobType?.image ?? '');
    setMaxNodes(String(initialPool?.max_nodes ?? jobType?.max_nodes ?? 1));
    setVmSize(initialPool?.vm_size ?? jobType?.vm_size ?? 'Standard_D2_v2');
    setMemory(jobType?.memory ?? '2Gi');
    setCpu(String(jobType?.cpu ?? 1));
    setCommand(JSON.stringify(jobType?.command ?? ['/bin/bash', '-c'], null, 2));
    setArgs(JSON.stringify(jobType?.args ?? [], null, 2));
    setError('');
  }, [jobType, open, pools]);

  const selectPool = (nextPoolName: string) => {
    setPoolName(nextPoolName);
    const selectedPool = pools.find(pool => pool.pool_name === nextPoolName);
    if (selectedPool) {
      setMaxNodes(String(selectedPool.max_nodes));
      setVmSize(selectedPool.vm_size);
    }
  };

  const submit = async () => {
    try {
      const parsedMaxNodes = Number(maxNodes);
      const parsedCpu = Number(cpu);
      if (!name.trim() || !poolName.trim() || !image.trim()) {
        throw new Error('Name, pool name, and image are required.');
      }
      if (!isValidJobTypeName(name.trim())) {
        throw new Error(
          'Name must be a lowercase Kubernetes name with at most 57 letters, numbers, or hyphens.'
        );
      }
      if (!Number.isInteger(parsedMaxNodes) || parsedMaxNodes < 0) {
        throw new Error('Max nodes must be a non-negative integer.');
      }
      if (!Number.isInteger(parsedCpu) || parsedCpu < 1) {
        throw new Error('CPU must be a positive integer.');
      }

      setSubmitting(true);
      await onSubmit({
        ...(jobType?.id ? { id: jobType.id } : {}),
        name: name.trim(),
        pool_name: poolName.trim(),
        image: image.trim(),
        max_nodes: parsedMaxNodes,
        vm_size: vmSize.trim(),
        memory: memory.trim(),
        cpu: parsedCpu,
        command: parseStringArray(command, 'Command'),
        args: parseStringArray(args, 'Arguments'),
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : String(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{jobType ? 'Edit job template' : 'Create job template'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} marginTop={1}>
          {error && <Alert severity="error"><BrandText text={error} /></Alert>}
          <TextField
            label="Name"
            value={name}
            onChange={event => setName(event.target.value)}
            disabled={Boolean(jobType)}
            required
            fullWidth
          />
          <FormControl fullWidth required>
            <InputLabel id={poolLabelId}>AKS node pool</InputLabel>
            <Select
              labelId={poolLabelId}
              label="AKS node pool"
              value={poolName}
              onChange={event => selectPool(event.target.value)}
              disabled={Boolean(jobType)}
            >
              {pools.map(pool => (
                <MenuItem key={pool.pool_name} value={pool.pool_name}>
                  {pool.pool_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Container image"
            value={image}
            onChange={event => setImage(event.target.value)}
            required
            fullWidth
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Max nodes"
              type="number"
              value={maxNodes}
              helperText="Managed by Bicep for the selected pool."
              disabled
              fullWidth
            />
            <TextField
              label="VM size"
              value={vmSize}
              helperText="Managed by Bicep for the selected pool."
              disabled
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Memory"
              value={memory}
              onChange={event => setMemory(event.target.value)}
              fullWidth
            />
            <TextField
              label="CPU"
              type="number"
              value={cpu}
              onChange={event => setCpu(event.target.value)}
              fullWidth
            />
          </Stack>
          <TextField
            label="Command (JSON array of strings)"
            value={command}
            onChange={event => setCommand(event.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
          <TextField
            label="Arguments (JSON array of strings)"
            value={args}
            onChange={event => setArgs(event.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={submitting} onClick={submit}>
          {jobType ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
