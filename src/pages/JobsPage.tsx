import {
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import { CreateJobDialog, UpdateJobDialog } from '../components/JobDialogs';
import { JobsTable } from '../components/JobTables';
import { ConfigurationRequired, ErrorAlert, LoadingState, PageHeader } from '../components/PageLayout';
import { getJobDisplayName, JOB_STATUSES } from '../model';
import { AhabJob, AhabJobType, CreateJobRequest, UpdateJobRequest } from '../types';
import { useAhabClient } from '../useAhabClient';

export default function JobsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { client, configError, credentialError, credentialLoading } = useAhabClient();
  const [jobs, setJobs] = React.useState<AhabJob[]>([]);
  const [jobTypes, setJobTypes] = React.useState<AhabJobType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedJob, setSelectedJob] = React.useState<AhabJob | null>(null);

  const load = React.useCallback(async () => {
    if (!client) {
      setLoading(false);
      return;
    }
    try {
      const [loadedJobs, loadedJobTypes] = await Promise.all([
        client.listJobs(),
        client.listJobTypes(),
      ]);
      setJobs(loadedJobs);
      setJobTypes(loadedJobTypes);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }, [client]);

  React.useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const createJob = async (request: CreateJobRequest) => {
    if (!client) {
      throw new Error('Ahab API is not configured.');
    }
    const result = await client.createJob(request);
    enqueueSnackbar(`Created job ${result.id ?? ''}.`, { variant: 'success' });
    await load();
  };

  const updateJob = async (job: AhabJob, request: UpdateJobRequest) => {
    if (!client) {
      throw new Error('Ahab API is not configured.');
    }
    await client.updateJob(job.id, request);
    enqueueSnackbar(`Updated job ${job.id}.`, { variant: 'success' });
    await load();
  };

  if (credentialLoading) {
    return <LoadingState label="Loading ahab connection..." />;
  }
  if (!client) {
    return <ConfigurationRequired error={configError || credentialError} />;
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = status === 'ALL' || job.current_status === status;
    const matchesSearch =
      !normalizedSearch ||
      job.id.toLowerCase().includes(normalizedSearch) ||
      job.job_type.toLowerCase().includes(normalizedSearch) ||
      getJobDisplayName(job).toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <PageHeader
        title="🦑 ahab jobs"
        description="Submit scientific workloads and update their lifecycle and outputs."
        actions={
          <>
            <Button onClick={() => void load()}>Refresh</Button>
            <Button
              variant="contained"
              disabled={jobTypes.length === 0}
              onClick={() => setCreateOpen(true)}
            >
              Create job
            </Button>
          </>
        }
      />
      <ErrorAlert error={error} />
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} marginBottom={2}>
            <TextField
              label="Search jobs"
              value={search}
              onChange={event => setSearch(event.target.value)}
              fullWidth
            />
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel id="ahab-status-filter-label">Status</InputLabel>
              <Select
                labelId="ahab-status-filter-label"
                label="Status"
                value={status}
                onChange={event => setStatus(event.target.value)}
              >
                <MenuItem value="ALL">All statuses</MenuItem>
                {JOB_STATUSES.map(item => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          {loading ? (
            <LoadingState />
          ) : (
            <JobsTable jobs={filteredJobs} onEdit={setSelectedJob} />
          )}
        </CardContent>
      </Card>
      <CreateJobDialog
        open={createOpen}
        jobTypes={jobTypes}
        onClose={() => setCreateOpen(false)}
        onSubmit={createJob}
      />
      <UpdateJobDialog
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onSubmit={updateJob}
      />
    </>
  );
}
