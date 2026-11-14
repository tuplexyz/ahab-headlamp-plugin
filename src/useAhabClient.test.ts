import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadApiKey: vi.fn(),
}));

vi.mock('./config', () => ({
  DEFAULT_CONFIG: {
    apiUrl: '',
    refreshSeconds: 30,
  },
  configStore: {
    useConfig: () => () => ({
      apiUrl: 'https://example.test',
      refreshSeconds: 30,
    }),
  },
}));

vi.mock('./credentials', () => ({
  CREDENTIAL_CHANGED_EVENT: 'ahab-credential-changed',
  loadApiKey: mocks.loadApiKey,
}));

import { useAhabClient } from './useAhabClient';

describe('useAhabClient', () => {
  beforeEach(() => {
    mocks.loadApiKey.mockReset();
    mocks.loadApiKey.mockResolvedValue('secret');
  });

  it('keeps the client stable across page state renders', async () => {
    const { result, rerender } = renderHook(() => useAhabClient());

    await waitFor(() => expect(result.current.credentialLoading).toBe(false));
    const client = result.current.client;
    expect(client).not.toBeNull();

    rerender();

    expect(result.current.client).toBe(client);
  });
});
