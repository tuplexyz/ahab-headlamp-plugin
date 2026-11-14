import { Headlamp } from '@kinvolk/headlamp-plugin/lib';

interface SecureStorageResult {
  success: boolean;
  value?: string | null;
  error?: string;
}

interface PluginSecureStorage {
  save(key: string, value: string): Promise<SecureStorageResult>;
  load(key: string): Promise<SecureStorageResult>;
  delete(key: string): Promise<SecureStorageResult>;
}

declare const pluginSecureStorage: PluginSecureStorage;

const API_KEY_STORAGE_KEY = 'ahab-function-key';
const BROWSER_SESSION_KEY = 'ahab-headlamp-plugin:function-key';
export const CREDENTIAL_CHANGED_EVENT = 'ahab-credential-changed';

function hasSecureStorage(): boolean {
  return Headlamp.isRunningAsApp() && typeof pluginSecureStorage !== 'undefined';
}

function notifyCredentialChanged(): void {
  window.dispatchEvent(new Event(CREDENTIAL_CHANGED_EVENT));
}

export function credentialStorageDescription(): string {
  return hasSecureStorage()
    ? 'The Function key is encrypted on this computer and isolated to the Ahab plugin.'
    : 'The Function key is kept only in this browser tab session.';
}

export async function loadApiKey(): Promise<string> {
  if (hasSecureStorage()) {
    const result = await pluginSecureStorage.load(API_KEY_STORAGE_KEY);
    if (!result.success) {
      throw new Error(result.error || 'Unable to load the stored Function key.');
    }
    return result.value ?? '';
  }
  return window.sessionStorage.getItem(BROWSER_SESSION_KEY) ?? '';
}

export async function saveApiKey(value: string): Promise<void> {
  const apiKey = value.trim();
  if (!apiKey) {
    throw new Error('Function key cannot be empty.');
  }

  if (hasSecureStorage()) {
    const result = await pluginSecureStorage.save(API_KEY_STORAGE_KEY, apiKey);
    if (!result.success) {
      throw new Error(result.error || 'Unable to save the Function key.');
    }
  } else {
    window.sessionStorage.setItem(BROWSER_SESSION_KEY, apiKey);
  }
  notifyCredentialChanged();
}

export async function deleteApiKey(): Promise<void> {
  if (hasSecureStorage()) {
    const result = await pluginSecureStorage.delete(API_KEY_STORAGE_KEY);
    if (!result.success) {
      throw new Error(result.error || 'Unable to delete the Function key.');
    }
  } else {
    window.sessionStorage.removeItem(BROWSER_SESSION_KEY);
  }
  notifyCredentialChanged();
}
