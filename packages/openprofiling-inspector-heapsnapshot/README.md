# OpenProfiling NodeJS - Inspector-based HeapSnapshot

This profiler is not advised to run in production (see drawbacks) but can help a lot debuging memory leak in production. It allows taking a snapshot of all the memory current allocated in your application. You will be able to see which type of object are alive in memory and why there can't be garbage collected when you launched the snapshot.

### Advantages

- Taking one snapshot will allows you to understand **why** a specific object has not been garbage collected by V8, by **why** we mean that it will see the relationship to a `root` (if any object is linked to a `root`, it cannot be garbage collected, a `root` can be a HTTP server, the `global` object or even simply the context of the javascript file where your code is running).
- Taking two snapshot escaped in time will allows you to make a `diff` between them and see the difference over time, generally the difference between both shoud be low (since when you finish processing a request, its context should be garbage collected). If you see a high difference in one object category, you can suspect a leak.
- The fact that is use the core `inspector` module means that it's **available out of the box without installing any dependency**.

### Drawbacks

- Since a snapshot is essentialy a copy of your application's memory, you can expect it to grow twice in size (ex: your app use 400Mb, expect it to grow over 800Mb). It can be a problem if your app use more than 1G because V8 have hard time dealing with large heap (please checkout [this bug report](https://bugs.chromium.org/p/chromium/issues/detail?id=768355))
- Again since you are copying your memory to analyse it, V8 will not execute any javascript in the mean time (to avoid any modification), so your application **will stop processing request** while making the snapshot.
- If you are using specific version of Node and the `inspector-heap-profiler` at the same time, it may crash your application (see [this bug report](https://github.com/nodejs/node/issues/23877))

### How to use

In the following example, you will need to send the `SIGUSR2` signal to the process to start the profiling and again when do you want to end it:

```ts
import { ProfilingAgent } from '@openprofiling/nodejs'
import { FileExporter } from '@openprofiling/exporter-file'
import { InspectorHeapSnapshot } from '@openprofiling/inspector-heapsnapshot'
import { SignalTrigger } from '@openprofiling/trigger-signal'

const profilingAgent = new ProfilingAgent()
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorHeapSnapshot())
profilingAgent.start({ exporter: new FileExporter() })
```

If you are using Node 8 and multiple profilers (ex: using both heap and cpu profiler), you will need to share a `inspector` session like this:

```ts
import { ProfilingAgent } from '@openprofiling/nodejs'
import { FileExporter } from '@openprofiling/exporter-file'
import { InspectorHeapSnapshot } from '@openprofiling/inspector-heapsnapshot'
import { InspectorHeapProfiler } from '@openprofiling/inspector-heap-profiler'
import { SignalTrigger } from '@openprofiling/trigger-signal'
import * as inspector from 'inspector'

const profilingAgent = new ProfilingAgent()
// creation a session
const session = new inspector.Session()
// give it as parameters to the constructor
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR1' }), new InspectorHeapSnapshot({ session }))
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorCPUProfiler({ session }))
profilingAgent.start({ exporter: new FileExporter() })
```

### Vizualisation

After retrieving the heapsnapshot file where it has been exported, it should have a `.heapsnapshot` extension. Which is the standard extension for this type of data.
You have multiple ways to read the output, here the list of (known) tools that you can use :
- Chrome Developers Tools: https://developers.google.com/web/tools/chrome-devtools/memory-problems/heap-snapshots#view_snapshots
- Heapviz: https://heapviz.com/