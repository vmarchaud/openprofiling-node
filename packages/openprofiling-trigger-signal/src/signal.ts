'use strict'

import { BaseTrigger, TriggerOptions, TriggerState } from '@openprofiling/core'

export interface TriggerSignalConfig extends TriggerOptions {
  signal: NodeJS.Signals
}

export class TriggerSignal extends BaseTrigger {

  private isProfiling: boolean = false
  private handler: () => void

  protected options: TriggerSignalConfig

  constructor (options: TriggerSignalConfig) {
    super(`signal-${options.signal.toLowerCase()}`, options)
    if (typeof options.signal !== 'string') {
      throw new Error(`You must define the 'signal' to which the trigger will respond`)
    }
  }

  init () {
    this.handler = this.onSignal.bind(this)
    process.on(this.options.signal, this.handler)
  }

  destroy () {
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
