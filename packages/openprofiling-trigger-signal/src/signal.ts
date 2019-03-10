'use strict'

import { Trigger, TriggerConfig, CoreAgent, TriggerState } from '../../openprofiling-core'

export interface TriggerSignalConfig extends TriggerConfig {
  signal: NodeJS.Signals
}

export class TriggerSignal implements Trigger {

  private internalName = ''
  private isProfiling: boolean = false
  private handler: () => void
  private options: TriggerSignalConfig
  private agent: CoreAgent

  enable (agent: CoreAgent, options: TriggerSignalConfig) {
    if (typeof options.signal !== 'string') {
      throw new Error(`You must define the 'signal' to which the trigger will respond`)
    }
    this.options = options
    this.handler = this.onSignal.bind(this)
    this.agent = agent
    process.on(options.signal, this.handler)
    this.internalName = `trigger-signal-${options.signal.toLowerCase()}`
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

  get name () {
    return this.internalName
  }

}
