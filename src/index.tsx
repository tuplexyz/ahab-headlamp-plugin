import {
  registerPluginSettings,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import squidSvg from './assets/ahab_squid_01_silhouette.svg?raw';
import { brandFont } from './components/BrandText';
import { withPageFooter } from './components/PageLayout';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import JobTypesPage from './pages/JobTypesPage';
import SettingsPage from './pages/SettingsPage';

const fontStylesheet = document.createElement('link');
fontStylesheet.rel = 'stylesheet';
fontStylesheet.href = 'https://fonts.googleapis.com/css2?family=Righteous&display=swap';
document.head.appendChild(fontStylesheet);

const sidebarStyles = document.createElement('style');
sidebarStyles.textContent = `a[href$="/ahab"] .MuiListItemText-primary { font-family: ${brandFont}; }`;
document.head.appendChild(sidebarStyles);

const squidIcon = {
  width: 392,
  height: 392,
  body: squidSvg.replace(/<\/?svg\b[^>]*>/g, '').replace(/fill="#000"/g, 'fill="currentColor"'),
};

registerSidebarEntry({
  name: 'ahab',
  label: 'ahab',
  url: '/ahab',
  icon: squidIcon,
  sidebar: 'HOME',
  useClusterURL: false,
});

registerSidebarEntry({
  parent: 'ahab',
  name: 'ahab-jobs',
  label: 'Jobs',
  url: '/ahab/jobs',
  icon: 'mdi:format-list-checks',
  sidebar: 'HOME',
  useClusterURL: false,
});

registerSidebarEntry({
  parent: 'ahab',
  name: 'ahab-job-types',
  label: 'Job types',
  url: '/ahab/job-types',
  icon: 'mdi:shape-outline',
  sidebar: 'HOME',
  useClusterURL: false,
});

registerSidebarEntry({
  parent: 'ahab',
  name: 'ahab-settings',
  label: 'Settings',
  url: '/ahab/settings',
  icon: 'mdi:cog-outline',
  sidebar: 'HOME',
  useClusterURL: false,
});

registerRoute({
  path: '/ahab',
  name: 'ahab',
  exact: true,
  sidebar: {
    item: 'ahab',
    sidebar: 'HOME',
  },
  useClusterURL: false,
  noAuthRequired: true,
  component: withPageFooter(DashboardPage),
});

registerRoute({
  path: '/ahab/jobs',
  name: 'ahab jobs',
  exact: true,
  sidebar: {
    item: 'ahab-jobs',
    sidebar: 'HOME',
  },
  useClusterURL: false,
  noAuthRequired: true,
  component: withPageFooter(JobsPage),
});

registerRoute({
  path: '/ahab/job-types',
  name: 'ahab job types',
  exact: true,
  sidebar: {
    item: 'ahab-job-types',
    sidebar: 'HOME',
  },
  useClusterURL: false,
  noAuthRequired: true,
  component: withPageFooter(JobTypesPage),
});

registerRoute({
  path: '/ahab/settings',
  name: 'ahab settings',
  exact: true,
  sidebar: {
    item: 'ahab-settings',
    sidebar: 'HOME',
  },
  useClusterURL: false,
  noAuthRequired: true,
  component: withPageFooter(SettingsPage),
});

registerPluginSettings('ahab-headlamp-plugin', SettingsPage, false);
