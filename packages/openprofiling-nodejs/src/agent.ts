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
  private started = false

  start (options: AgentConfig): ProfilingAgent {
    this._options = options
    this.started = true

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
    if (this.started === true) {
      throw new Error(`You cannot register new link between trigger and profiler when the agent has been started`)
    }
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
    this.started = false
  }

  isStarted () {
    return this.started
  }

}
