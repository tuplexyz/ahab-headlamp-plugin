import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { BrandText } from '../components/BrandText';
import { JobsTable } from '../components/JobTables';
import { ConfigurationRequired, ErrorAlert, LoadingState, PageHeader } from '../components/PageLayout';
import { configStore, DEFAULT_CONFIG } from '../config';
import { AhabJob, AhabJobType } from '../types';
import { useAhabClient } from '../useAhabClient';

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="text.secondary">{label}</Typography>
        <Typography variant="h3">{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const { client, configError, credentialError, credentialLoading } = useAhabClient();
  const useConfig = configStore.useConfig();
  const config = { ...DEFAULT_CONFIG, ...useConfig() };
  const [jobs, setJobs] = React.useState<AhabJob[]>([]);
  const [jobTypes, setJobTypes] = React.useState<AhabJobType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(
    async (showNotification = false) => {
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
        if (showNotification) {
          enqueueSnackbar(<BrandText text="ahab data refreshed." />, { variant: 'success' });
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : String(loadError));
      } finally {
        setLoading(false);
      }
    },
    [client, enqueueSnackbar]
  );

  React.useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!client || config.refreshSeconds <= 0) {
      return undefined;
    }
    const timer = window.setInterval(() => void load(), config.refreshSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [client, config.refreshSeconds, load]);

  if (credentialLoading) {
    return <LoadingState label="Loading ahab connection..." />;
  }
  if (!client) {
    return <ConfigurationRequired error={configError || credentialError} />;
  }

  const active = jobs.filter(job =>
    ['UNSCHEDULED', 'PENDING', 'STARTED'].includes(job.current_status)
  ).length;
  const failed = jobs.filter(job => job.current_status === 'FAILED').length;
  const complete = jobs.filter(job =>
    ['COMPLETE', 'COMPLETED'].includes(job.current_status)
  ).length;

  return (
    <>
      <PageHeader
        title="🦑 ahab"
        description="Scientific workload activity across the ahab API and AKS cluster."
        actions={
          <>
            <Button onClick={() => history.push('/ahab/jobs')}>View jobs</Button>
            <Button onClick={() => history.push('/ahab/job-types')}>Job types</Button>
            <Button variant="contained" onClick={() => void load(true)}>
              Refresh
            </Button>
          </>
        }
      />
      <ErrorAlert error={error} />
      <Stack
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }}
        gap={2}
        marginBottom={3}
      >
        <MetricCard label="Total jobs" value={jobs.length} />
        <MetricCard label="Active" value={active} />
        <MetricCard label="Complete" value={complete} />
        <MetricCard label="Failed" value={failed} />
        <MetricCard label="Job types" value={jobTypes.length} />
      </Stack>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" marginBottom={2}>
            Recent jobs
          </Typography>
          {loading ? <LoadingState /> : <JobsTable jobs={jobs} limit={10} />}
        </CardContent>
      </Card>
    </>
  );
}
