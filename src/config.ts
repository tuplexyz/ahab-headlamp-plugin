import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';

export interface AhabPluginConfig {
  apiUrl: string;
  refreshSeconds: number;
}

export const DEFAULT_CONFIG: AhabPluginConfig = {
  apiUrl: '',
  refreshSeconds: 30,
};

export const configStore = new ConfigStore<AhabPluginConfig>('ahab-headlamp-plugin');

export function getConfig(): AhabPluginConfig {
  return {
    ...DEFAULT_CONFIG,
    ...configStore.get(),
  };
}
