import { Button, Card, CardContent } from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import { JobTypeDialog } from '../components/JobDialogs';
import { JobTypesTable } from '../components/JobTables';
import {
  ConfigurationRequired,
  ErrorAlert,
  LoadingState,
  PageHeader,
} from '../components/PageLayout';
import { AhabJobType } from '../types';
import { useAhabClient } from '../useAhabClient';

export default function JobTypesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { client, configError, credentialError, credentialLoading } = useAhabClient();
  const [jobTypes, setJobTypes] = React.useState<AhabJobType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedJobType, setSelectedJobType] = React.useState<AhabJobType | null>(null);

  const load = React.useCallback(async () => {
    if (!client) {
      setLoading(false);
      return;
    }
    try {
      setJobTypes(await client.listJobTypes());
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

  const saveJobType = async (jobType: AhabJobType) => {
    if (!client) {
      throw new Error('Ahab API is not configured.');
    }
    if (selectedJobType) {
      await client.updateJobType(jobType);
      enqueueSnackbar(`Updated job type ${jobType.name}.`, { variant: 'success' });
    } else {
      await client.createJobType(jobType);
      enqueueSnackbar(`Created job type ${jobType.name}.`, { variant: 'success' });
    }
    await load();
  };

  if (credentialLoading) {
    return <LoadingState label="Loading ahab connection..." />;
  }
  if (!client) {
    return <ConfigurationRequired error={configError || credentialError} />;
  }

  return (
    <>
      <PageHeader
        title="🦑 ahab job templates"
        description="Manage workload definitions on AKS pools deployed through Bicep."
        actions={
          <>
            <Button onClick={() => void load()}>Refresh</Button>
            <Button
              variant="contained"
              disabled={jobTypes.length === 0}
              title={
                jobTypes.length === 0
                  ? 'Deploy and initialize at least one AKS job pool before creating a job type.'
                  : undefined
              }
              onClick={() => setCreateOpen(true)}
            >
              Create job template
            </Button>
          </>
        }
      />
      <ErrorAlert error={error} />
      <Card variant="outlined">
        <CardContent>
          {loading ? (
            <LoadingState />
          ) : (
            <JobTypesTable jobTypes={jobTypes} onEdit={setSelectedJobType} />
          )}
        </CardContent>
      </Card>
      <JobTypeDialog
        open={createOpen}
        poolOptions={jobTypes}
        onClose={() => setCreateOpen(false)}
        onSubmit={saveJobType}
      />
      <JobTypeDialog
        open={Boolean(selectedJobType)}
        jobType={selectedJobType}
        poolOptions={jobTypes}
        onClose={() => setSelectedJobType(null)}
        onSubmit={saveJobType}
      />
    </>
  );
}
