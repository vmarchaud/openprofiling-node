# OpenProfiling NodeJS - Signal Trigger

This trigger is most probably the easier to use because you just need to send a signal to the process (which is generally straightforward even with containers).

### Advantages

- No specific setup, one CLI command away

### Drawbacks

- Limited list of signal to listen on (see [official doc](https://nodejs.org/dist/latest-v10.x/docs/api/process.html#process_signal_events))
    - I advise to use the `SIGUSR1` and `SIGUSR2` signal since they are reserved for user-space behavior.
- Behavior on Windows might be a little more complicated since there a no concept of `signals` on it (see official doc at the end of the previous link)

### How to use

In the following example, when the profile will be done it will be written on disk:

```ts
import { ProfilingAgent } from '@openprofiling/nodejs'
import { FileExporter } from '@openprofiling/exporter-file'
import { InspectorCPUProfiler } from '@openprofiling/inspector-cpu-profiler'
import { SignalTrigger } from '@openprofiling/trigger-signal'

const profilingAgent = new ProfilingAgent()
// you just need to precise which signal the trigger need to listen
// little advise: only use SIGUSR1 or SIGUSR2
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorCPUProfiler())
profilingAgent.start({ exporter: new FileExporter() })
```

Then to initiate the trigger, just send a signal to the desirated process:

linux/macos:
```bash
kill -s USR1 <pid>
```

You can find the PID via `htop`, `ps aux` or just log your process pid with `console.log('Process pid is ' + process.pid`)` when your application start.