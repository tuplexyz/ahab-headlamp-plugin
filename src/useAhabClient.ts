import React from 'react';
import { AhabApiClient } from './api';
import { configStore, DEFAULT_CONFIG } from './config';
import { CREDENTIAL_CHANGED_EVENT, loadApiKey } from './credentials';

export interface AhabConnection {
  client: AhabApiClient | null;
  configError: string;
  credentialError: string;
  credentialLoading: boolean;
  hasCredential: boolean;
}

export function useAhabClient(): AhabConnection {
  const useConfig = configStore.useConfig();
  const savedConfig = useConfig();
  const config = {
    ...DEFAULT_CONFIG,
    ...savedConfig,
  };
  const [apiKey, setApiKey] = React.useState('');
  const [credentialLoading, setCredentialLoading] = React.useState(true);
  const [credentialError, setCredentialError] = React.useState('');

  const refreshCredential = React.useCallback(async () => {
    setCredentialLoading(true);
    try {
      setApiKey(await loadApiKey());
      setCredentialError('');
    } catch (error) {
      setApiKey('');
      setCredentialError(error instanceof Error ? error.message : String(error));
    } finally {
      setCredentialLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshCredential();
    window.addEventListener(CREDENTIAL_CHANGED_EVENT, refreshCredential);
    return () => {
      window.removeEventListener(CREDENTIAL_CHANGED_EVENT, refreshCredential);
    };
  }, [refreshCredential]);

  const { client, configError } = React.useMemo(() => {
    if (config.apiUrl && apiKey) {
      try {
        return {
          client: new AhabApiClient(config.apiUrl, apiKey),
          configError: '',
        };
      } catch (error) {
        return {
          client: null,
          configError: error instanceof Error ? error.message : String(error),
        };
      }
    }
    return {
      client: null,
      configError:
        config.apiUrl && !credentialLoading && !credentialError
          ? 'Configure a Function key before using the Ahab API.'
          : '',
    };
  }, [apiKey, config.apiUrl, credentialError, credentialLoading]);

  return {
    client,
    configError,
    credentialError,
    credentialLoading,
    hasCredential: Boolean(apiKey),
  };
}
