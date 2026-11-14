# Headlamp / AKS Desktop plugin for *ahab*

This plugin adds Ahab workload management to Headlamp and AKS Desktop. It uses
the Ahab Azure Function API to provide:

- A dashboard with job and job-type counts
- Job listing, filtering, creation, status updates, and output updates
- Job-type listing, creation, and editing on AKS pools deployed through Bicep
- Click-to-open job and template details, including recent dashboard jobs
- Configurable automatic refresh
- Encrypted Function-key storage in Headlamp Desktop and AKS Desktop

In browser-hosted Headlamp, the Function key is stored only in the current
browser tab's session storage.

Open **Ahab > Job types** and choose **Create job template** to add a workload
definition to an existing initialized AKS pool. VM size and maximum nodes are
infrastructure-managed. Click a job/template row (or focus it and press Enter
or Space) to inspect its complete document in a read-only modal. The separate
**Update** and **Edit** buttons retain their existing editing behavior.

The jobs list uses `GET /api/job` without a `job_type` query parameter, so
refreshing does not claim pending work. For job creation, `rnaseq` workers need
`inputs.transcriptome`, `inputs.reads`, and `inputs.outdir`; `wgs` workers need
`inputs.outdir` and optionally `inputs.inputdir`. Use a unique output directory
per job. Successful workers report `COMPLETE`, and failures report `FAILED`.

## Development

Use Node.js 22, matching the AKS Desktop build environment.

```bash
npm ci
npm run tsc
npm test
npm run lint
npm run build
npm start
```

For a packaged Headlamp Desktop application, enable plugin development mode
under **Settings > Plugins** before running `npm start`.

## Configure

Open **Ahab > Settings** or **Settings > Plugins > ahab-headlamp-plugin** and
provide:

- The Function App URL, such as
  `https://func-ahab-dev-eastus-001.azurewebsites.net`
- The Function key
- The automatic refresh interval

The Function App must permit the Headlamp origin through CORS. The repository's
Bicep parameters expose `functionCorsAllowedOrigins`; the default permits all
origins so that desktop and browser Headlamp installations work. Restrict it to
known origins when the deployment environment has stable Headlamp URLs.

## Bundle into AKS Desktop

Copy this directory into an AKS Desktop checkout as `plugins/ahab`, then add the
following entry to the root `package.json` under `headlamp.plugins`:

```json
{
  "name": "ahab",
  "packageName": "ahab-headlamp-plugin",
  "source": "plugins/ahab",
  "enabledByDefault": true
}
```

Build and stage the configured plugins from the AKS Desktop repository root:

```bash
npm run plugin:setup
```

No `headlamp.runCommands` permissions are required because the plugin calls the
Ahab HTTPS API directly.
