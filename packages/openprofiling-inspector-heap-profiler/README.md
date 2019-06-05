# OpenProfiling NodeJS - Inspector-based Sampling Javascript Heap Profiler

This profiler is the recomended one to profile the memory usage per function of your NodeJS application. It has a almost-zero impact on performance and specially suited for long-lived application.

**NOTE**: Do not confuse the Sampling Heap Profiler (which is the same as `Allocation Sampling`) with the `Allocation Instrumentation`. The Instrumentation based is useful for recording *every* allocation but it was a greater impact in performance (and is not available currently in openprofiling).

### Advantages

- The profiler will only record allocation made each X bytes (by default every 8KiB) which it doesn't impact a lot in terms of performance, while it's not possible to give a specific percentage, the V8 team made a module on top of the same API and said that it was fine to use in production ([src]()https://github.com/v8/sampling-heap-profiler)
- The fact that is use the core `inspector` module means that it's **available out of the box without installing any dependency**.

### Drawbacks

- The **sampling approach means that you never record every memory allocations**, while it's possible that it doesn't record an allocation, it's highly impropable that it doesn't record it over one minute, specially if the function is called often. Put simply, **the more a given function allocate memory, the more it had the chance to be recorded**.
- This profiler only record Javascript functions, which is generally enough, you will not be able to profile any C/C++ code running (eiter from V8, libuv, NodeJS or a native addon).
- If you are using Node 8, the `inspector` module can have only one  session for a given process, means that if another dependency (generally APM vendors) already use it, you will have errors either in `openprofiling` or the other module.
- Some V8 versions [has specific bug](https://bugs.chromium.org/p/chromium/issues/detail?id=847863) that can impact your application, that's why it's not available for all versions in node 10.
- Since it doesn't record every memory allocation, **the profiler isn't suited for short-lived application** (ex: serverless) or to record memory allocation for a given request.

### How to use

In the following example, you will need to send the `SIGUSR2` signal to the process to start the profiling and again when do you want to end it:

```ts
import { ProfilingAgent } from '@openprofiling/nodejs'
import { FileExporter } from '@openprofiling/exporter-file'
import { InspectorHeapProfiler } from '@openprofiling/inspector-heap-profiler'
import { SignalTrigger } from '@openprofiling/trigger-signal'

const profilingAgent = new ProfilingAgent()
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorHeapProfiler())
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
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorHeapProfiler({ session }))
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR1' }), new InspectorCPUProfiler({ session }))
profilingAgent.start({ exporter: new FileExporter() })
```

After starting your process, you just need to send to it the configured signal:
- linux/macos: `kill -s USR2 <pid>`
- kubectl: `kubectl exec -ti <name-of-pod> /bin/kill -s USR2 1` (assuming your process is the pid 1)

You can find the pid either by `console.log(process.pid)` when your process start or use `ps aux | grep node` and looking for your process.
The first time you send the signal, it will start the profiler which will start recording memory allocation, you should then wait for your memory leak to happen again.
When you think you collected enough data (either you reproduced the leak or you believe there enought data), you just need to send the same signal as above.
The profiling agent will then write the file to the disk (by default in `/tmp`), it should start with `heap-profile`.

### Vizualisation

After retrieving the cpu profile file where it has been exported, it should have a `.heapprofile` extension. Which is the standard extension for this type of data.
You have multiple ways to read the output, here the list of (known) tools that you can use :
- Chrome Developers Tools (Memory tab)
- Speedscope: https://github.com/jlfwong/speedscope