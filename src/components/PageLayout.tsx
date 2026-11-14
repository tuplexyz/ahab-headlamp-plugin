import { Alert, Box, Button, CircularProgress, Link, Stack, Typography } from '@mui/material';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { brandFont, BrandText } from './BrandText';

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      spacing={2}
      marginBottom={3}
    >
      <Box>
        <Typography variant="h4" component="h1">
          <BrandText text={title} />
        </Typography>
        <Typography color="text.secondary">
          <BrandText text={description} />
        </Typography>
      </Box>
      {actions && (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {actions}
        </Stack>
      )}
    </Stack>
  );
}

export function LoadingState({ label = 'Loading ahab data...' }: { label?: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={2} padding={3}>
      <CircularProgress size={24} />
      <Typography>
        <BrandText text={label} />
      </Typography>
    </Stack>
  );
}

export function ConfigurationRequired({ error }: { error?: string }) {
  const history = useHistory();
  return (
    <Alert
      severity={error ? 'error' : 'info'}
      action={
        <Button color="inherit" size="small" onClick={() => history.push('/ahab/settings')}>
          Configure
        </Button>
      }
    >
      <BrandText
        text={error || 'Configure the ahab API URL and Function key before using this page.'}
      />
    </Alert>
  );
}

export function ErrorAlert({ error }: { error: string }) {
  if (!error) {
    return null;
  }
  return (
    <Alert severity="error" sx={{ marginBottom: 2 }}>
      <BrandText text={error} />
    </Alert>
  );
}

export function withPageFooter(Page: React.ComponentType) {
  return function PageWithFooter() {
    return (
      <>
        <Page />
        <Box
          component="footer"
          sx={{
            mt: 4,
            py: 2,
            borderTop: 1,
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Built by{' '}
            <Box component="span" sx={{ fontFamily: brandFont }}>
              &lt;Tuple&gt;
            </Box>{' '}
            - The Cloud Genomics Company (
            <Link href="https://tuple.xyz/solutions/ahab" target="_blank" rel="noopener noreferrer">
              <BrandText text="tuple.xyz/solutions/ahab" />
            </Link>
            )
          </Typography>
        </Box>
      </>
    );
  };
}
