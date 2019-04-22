
import { ProfilingAgent } from '../packages/openprofiling-nodejs'
import { FileExporter } from '../packages/openprofiling-exporter-file'
import { InspectorCPUProfiler } from '../packages/openprofiling-inspector-cpu-profiler'
import { TriggerSignal } from '../packages/openprofiling-trigger-signal'

const profilingAgent = new ProfilingAgent()
profilingAgent.register(new TriggerSignal({ signal: 'SIGUSR2' }), new InspectorCPUProfiler({}))
profilingAgent.start({ exporter: new FileExporter(), logLevel: 4 })

setInterval(_ => {
  console.log(process.pid)
}, 1000)
