# OpenProfiling NodeJS - Google Cloud Storage Exporter

This exporter is advised when profiling distributed applications where retrieving from each container file system can be hard.
It will just write the profile to a remote S3-compatible server, the file name in each bucket will follow the following format:

```js
const name = `${profile.kind}-${profile.startTime.toISOString()}.${profile.extension}`
```

Where the profile kind can be: `HEAP_PROFILE`, `CPU_PROFILE` or `PERFECTO`
And the extension can be either: `heaprofile`, `cpuprofile` or `json`

### Advantages

- Centralization of every profile, prefered when using containers

### Drawbacks

- You need to have a S3 compatible running (or AWS S3 itself) and manage it yourself.

### How to use

In the following example, when the profile will be done it will be written to the remote S3 bucket:

```ts
import { ProfilingAgent } from '@openprofiling/nodejs'
import { GcloudStorageExporter } from '@openprofiling/exporter-gcs'
import { InspectorCPUProfiler } from '@openprofiling/inspector-cpu-profiler'
import { SignalTrigger } from '@openprofiling/trigger-signal'

const profilingAgent = new ProfilingAgent()
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorCPUProfiler())
profilingAgent.start({
  exporter: new GcloudStorageExporter({
     // Alternatively, you might pass it via the GOOGLE_APPLICATION_CREDENTIALS env variable
    keyFilename: 'some/where/key.json',
    // Alternatively, you might pass it via the GCLOUD_PROJECT env variable
    projectId: 'my-project', 
    /*
    * name of the bucket to create
    */
    bucket: 'test'
  }
})
```

## Development

When developing against this package, you might want to run a fake gcs server with Minio to be able to run tests and verify the behavior:

```bash
docker run -d --name fake-gcs-server -p 4443:4443 fsouza/fake-gcs-server
```