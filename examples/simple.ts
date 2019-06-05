
import { ProfilingAgent } from '../packages/openprofiling-nodejs'
import { FileExporter } from '../packages/openprofiling-exporter-file'
import { InspectorHeapProfiler } from '../packages/openprofiling-inspector-heap-profiler'
import { InspectorCPUProfiler } from '../packages/openprofiling-inspector-cpu-profiler'
import { SignalTrigger } from '../packages/openprofiling-trigger-signal'
import * as inspector from 'inspector'

const profilingAgent = new ProfilingAgent()
const session = new inspector.Session()
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorHeapProfiler({ session }))
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR1' }), new InspectorCPUProfiler({ session }))
profilingAgent.start({ exporter: new FileExporter(), logLevel: 4 })

setInterval(_ => {
  console.log(process.pid)
}, 1000)
