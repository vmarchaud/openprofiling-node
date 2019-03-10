'use strict'

import { CoreAgent, Config, Exporter, Profiler, Reaction, Trigger } from '@openprofiling/core'

export interface AgentConfig {
  exporter: Exporter
  logLevel?: number
}

export class ProfilingAgent {

  private agent: CoreAgent = new CoreAgent()
  private reactions: Reaction[] = []

  start (options: AgentConfig): ProfilingAgent {
    for (let reaction of this.reactions) {
      reaction.trigger.enable(this.agent)
      reaction.profiler.enable(this.agent)
    }
    this.agent.start(Object.assign(options, { reactions: this.reactions }))
    return this
  }

  register (trigger: Trigger, profiler: Profiler): ProfilingAgent {
    this.reactions.push({ trigger, profiler })
    return this
  }

  stop () {
    this.agent.stop()
    for (let reaction of this.reactions) {
      reaction.trigger.disable()
      reaction.profiler.disable()
    }
  }

}
