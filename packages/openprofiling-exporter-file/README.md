# OpenProfiling NodeJS - File Exporter

This exporter is the simplest one, it will just write the profile to the disk, you can configure the path if needed.
The file name will follow the following format:

```js
const name = `${profile.kind}-${profile.startTime.toISOString()}.${profile.extension}`
```

Where the profile kind can be: `HEAP_PROFILE`, `CPU_PROFILE` or `HEAP_SNAPSHOT`
And the extension can be either: `heaprofile`, `cpuprofile` or `heapsnapshot`

### Advantages

- Since the exporter just write the disk, it's easy to find if you don't have a lot of servers and specially low chance of failing (since disks are pretty resilient)
- Easy setup, since again you are simply writing on the disk

### Drawbacks

- Hard to locate and retrieve the file if your applications are distributed, it would be better to use the S3 exporter in this case.
- The exporter will not add any metadata to the file, so the profile attributes are generally lost (for example if it has failed, no error will be given)

### How to use

In the following example, when the profile will be done it will be written on disk:

```ts
import { ProfilingAgent } from '@openprofiling/nodejs'
import { FileExporter } from '@openprofiling/exporter-file'
import { InspectorCPUProfiler } from '@openprofiling/inspector-cpu-profiler'
import { SignalTrigger } from '@openprofiling/trigger-signal'

const profilingAgent = new ProfilingAgent()
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorCPUProfiler())
profilingAgent.start({ exporter: new FileExporter() })
```
