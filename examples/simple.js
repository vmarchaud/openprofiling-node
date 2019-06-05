
const { ProfilingAgent } = require('../packages/openprofiling-nodejs')
const { FileExporter } = require('../packages/openprofiling-exporter-file')
const { InspectorHeapProfiler } = require('../packages/openprofiling-inspector-heap-profiler')
const { InspectorCPUProfiler } = require('../packages/openprofiling-inspector-cpu-profiler')
const { SignalTrigger } = require('../packages/openprofiling-trigger-signal')
const inspector = require('inspector')

const profilingAgent = new ProfilingAgent()
const session = new inspector.Session()
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorHeapProfiler({ session }))
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR1' }), new InspectorCPUProfiler({ session }))
profilingAgent.start({ exporter: new FileExporter(), logLevel: 4 })

setInterval(_ => {
  console.log(process.pid)
}, 1000)
