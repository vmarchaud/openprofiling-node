'use strict'

import { BaseTrigger, TriggerOptions, TriggerState } from '@openprofiling/core'

export interface SignalTriggerOptions extends TriggerOptions {
  signal: NodeJS.Signals
}

export class SignalTrigger extends BaseTrigger {

  private isProfiling: boolean = false
  private handler: () => void

  protected options: SignalTriggerOptions

  constructor (options: SignalTriggerOptions) {
    super(`signal-${options.signal.toLowerCase()}`, options)
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
      this.isProfiling = false
    } else {
      this.agent.onTrigger(this, TriggerState.START)
      this.isProfiling = true
    }
  }

}
