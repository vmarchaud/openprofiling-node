'use strict'

import { CoreAgent, Exporter, Profiler, Reaction, Trigger } from '@openprofiling/core'

export interface AgentConfig {
  exporter: Exporter
  logLevel?: number
}

export class ProfilingAgent {

  private agent: CoreAgent = new CoreAgent()
  private reactions: Reaction[] = []
  private _options: AgentConfig

  start (options: AgentConfig): ProfilingAgent {
    this._options = options

    for (let reaction of this.reactions) {
      reaction.trigger.enable(this.agent)
      reaction.profiler.enable(this.agent)
    }
    this.agent.start(Object.assign(options, { reactions: this.reactions }))
    this._options.exporter.enable(this.agent)
    this.agent.registerProfileListener(options.exporter)
    return this
  }

  register (trigger: Trigger, profiler: Profiler): ProfilingAgent {
    this.reactions.push({ trigger, profiler })
    return this
  }

  stop () {
    for (let reaction of this.reactions) {
      reaction.trigger.disable()
      reaction.profiler.disable()
    }
    this.agent.unregisterProfileListener(this._options.exporter)
    this._options.exporter.disable()
    this.agent.stop()
  }

}
