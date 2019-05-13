# OpenProfiling NodeJS - Inspector-based Sampling Javascript CPU Profiler

This profiler is the recomended one to profile the CPU usage of your NodeJS application. It has a almost-zero impact on performance and specially suited for long-lived application.

### Advantages

- This profiler works by forking a new specific thread, which will capture the main thread stacktrace (list of functions) every 1ms (by default), then aggregate the result to have approximatilly the CPU usage for a given period. **This implementation have the advantage that it doesn't run any additional code on the main thread which doesn't slow your application.**
- The fact that is use the core `inspector` module means that it's **available out of the box without installing any dependency**.

### Drawbacks

- The **sampling approch means that you never record every functions**, while it's possible that it doesn't record a function, it's highly impropable that it doesn't record it over one minute, specially if the function is called often. Put simply, **the more a given function use CPU time, the more it had the chance to be recorded**.
- This profiler only record Javascript functions, which is generally enough, you will not be able to profile any C/C++ code running (eiter from V8, libuv, NodeJS or a native addon).
- If you are using Node 8, the `inspector` module can have only one  session for a given process, means that if another dependency (generally APM vendors) already use it, you will have errors either in `openprofiling` or the other module.
- Some V8 versions [has specific bug](https://bugs.chromium.org/p/v8/issues/detail?id=6623) that can impact your application, that's why it's not available for all versions in node 8.
- Since it doesn't record every function call, **the profiler isn't suited for short-lived application** (ex: serverless) or to record cpu usage for a given request.

### How to use

In the following example, you will need to send the `SIGUSR2` signal to the process to start the profiling and again when do you want to start:

```ts
import { ProfilingAgent } from '@openprofiling/nodejs'
import { FileExporter } from '@openprofiling/exporter-file'
import { InspectorCPUProfiler } from '@openprofiling/inspector-cpu-profiler'
import { SignalTrigger } from '@openprofiling/trigger-signal'

const profilingAgent = new ProfilingAgent()
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorCPUProfiler())
profilingAgent.start({ exporter: new FileExporter() })
```

If you are using Node 8 and multiple profilers (ex: using both heap and cpu profiler), you will need to share a `inspector` session like this:

```ts
import { ProfilingAgent } from '@openprofiling/nodejs'
import { FileExporter } from '@openprofiling/exporter-file'
import { InspectorCPUProfiler } from '@openprofiling/inspector-cpu-profiler'
import { InspectorHeapProfiler } from '@openprofiling/inspector-heap-profiler'
import { SignalTrigger } from '@openprofiling/trigger-signal'
import * as inspector from 'inspector'

const profilingAgent = new ProfilingAgent()
// creation a session
const session = new inspector.Session()
// give it as parameters to the constructor
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR1' }), new InspectorHeapProfiler({ session }))
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorCPUProfiler({ session }))
profilingAgent.start({ exporter: new FileExporter() })
```

### Vizualisation

After retrieving the cpu profile file where it has been exported, it should have a `.cpuprofile` extension. Which is the standard extension for this type of data.
You have multiple ways to read the output, here the list of (known) tools that you can use :
- Chrome Developers Tools: https://developers.google.com/web/updates/2016/12/devtools-javascript-cpu-profile-migration#old
- Speedscope: https://github.com/jlfwong/speedscope
- Flamebearer: https://github.com/mapbox/flamebearer