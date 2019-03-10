'use strict'

import { Trigger, TriggerConfig, CoreAgent, TriggerState } from '@openprofiling/core'

export interface TriggerSignalConfig extends TriggerConfig {
  signal: NodeJS.Signals
}

export class TriggerSignal implements Trigger {

  private isProfiling: boolean = false
  private handler: () => void
  private options: TriggerSignalConfig
  private agent: CoreAgent

  constructor (options: TriggerSignalConfig) {
    if (typeof options.signal !== 'string') {
      throw new Error(`You must define the 'signal' to which the trigger will respond`)
    }
    this.options = options
  }

  enable (agent: CoreAgent) {
    this.handler = this.onSignal.bind(this)
    this.agent = agent
    process.on(this.options.signal, this.handler)
  }

  disable () {
    process.removeListener(this.options.signal, this.handler)
  }

  onSignal () {
    if (this.isProfiling) {
      this.agent.onTrigger(this, TriggerState.END)
    } else {
      this.agent.onTrigger(this, TriggerState.START)
    }
  }

}
