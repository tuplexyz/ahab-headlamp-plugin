import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import { AhabApiClient, normalizeApiRoot } from '../api';
import { BrandText } from '../components/BrandText';
import { PageHeader } from '../components/PageLayout';
import { configStore, DEFAULT_CONFIG } from '../config';
import {
  credentialStorageDescription,
  deleteApiKey,
  loadApiKey,
  saveApiKey,
} from '../credentials';

export default function SettingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const useConfig = configStore.useConfig();
  const savedConfig = useConfig();
  const config = { ...DEFAULT_CONFIG, ...savedConfig };
  const [apiUrl, setApiUrl] = React.useState(config.apiUrl);
  const [refreshSeconds, setRefreshSeconds] = React.useState(String(config.refreshSeconds));
  const [replacementKey, setReplacementKey] = React.useState('');
  const [hasStoredKey, setHasStoredKey] = React.useState(false);
  const [error, setError] = React.useState('');
  const [working, setWorking] = React.useState(false);

  const refreshKeyStatus = React.useCallback(async () => {
    try {
      setHasStoredKey(Boolean(await loadApiKey()));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    }
  }, []);

  React.useEffect(() => {
    void refreshKeyStatus();
  }, [refreshKeyStatus]);

  const validateConfig = () => {
    const normalizedUrl = normalizeApiRoot(apiUrl);
    const parsedRefreshSeconds = Number(refreshSeconds);
    if (!Number.isFinite(parsedRefreshSeconds) || parsedRefreshSeconds < 0) {
      throw new Error('Refresh interval must be zero or a positive number.');
    }
    return {
      apiUrl: normalizedUrl,
      refreshSeconds: Math.floor(parsedRefreshSeconds),
    };
  };

  const save = async () => {
    try {
      setWorking(true);
      const nextConfig = validateConfig();
      configStore.set(nextConfig);
      if (replacementKey.trim()) {
        await saveApiKey(replacementKey);
        setReplacementKey('');
      }
      await refreshKeyStatus();
      setApiUrl(nextConfig.apiUrl);
      setError('');
      enqueueSnackbar(<BrandText text="ahab connection settings saved." />, { variant: 'success' });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setWorking(false);
    }
  };

  const test = async () => {
    try {
      setWorking(true);
      const nextConfig = validateConfig();
      const apiKey = replacementKey.trim() || (await loadApiKey());
      const client = new AhabApiClient(nextConfig.apiUrl, apiKey);
      await Promise.all([client.listJobs(), client.listJobTypes()]);
      setError('');
      enqueueSnackbar(<BrandText text="Connected to the ahab API." />, { variant: 'success' });
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : String(testError));
    } finally {
      setWorking(false);
    }
  };

  const clearKey = async () => {
    try {
      setWorking(true);
      await deleteApiKey();
      setReplacementKey('');
      setHasStoredKey(false);
      setError('');
      enqueueSnackbar('Stored Function key removed.', { variant: 'success' });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : String(deleteError));
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <PageHeader
        title="🦑 ahab settings"
        description="Connect the plugin to the ahab Azure Function API."
      />
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2} maxWidth={760}>
            {error && (
              <Alert severity="error">
                <BrandText text={error} />
              </Alert>
            )}
            <TextField
              label={<BrandText text="ahab API URL" />}
              helperText="Use the Function App URL or a URL ending in /api."
              value={apiUrl}
              onChange={event => setApiUrl(event.target.value)}
              placeholder="https://func-ahab-dev-eastus-001.azurewebsites.net"
              fullWidth
            />
            <TextField
              label="Automatic refresh interval (seconds)"
              helperText="Set to 0 to disable automatic dashboard refresh."
              type="number"
              inputProps={{ min: 0 }}
              value={refreshSeconds}
              onChange={event => setRefreshSeconds(event.target.value)}
              fullWidth
            />
            <TextField
              label={hasStoredKey ? 'Replace Function key' : 'Function key'}
              helperText={<BrandText text={credentialStorageDescription()} />}
              type="password"
              autoComplete="new-password"
              value={replacementKey}
              onChange={event => setReplacementKey(event.target.value)}
              fullWidth
            />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Stored key: {hasStoredKey ? 'configured' : 'not configured'}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="contained" disabled={working} onClick={() => void save()}>
                Save settings
              </Button>
              <Button disabled={working} onClick={() => void test()}>
                Test connection
              </Button>
              <Button
                color="error"
                disabled={working || !hasStoredKey}
                onClick={() => void clearKey()}
              >
                Remove stored key
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
