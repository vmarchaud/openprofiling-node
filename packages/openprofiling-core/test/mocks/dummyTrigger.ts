
import { BaseTrigger, TriggerState } from '../../src'

export class DummyTrigger extends BaseTrigger {
  constructor () {
    super('dummny-trigger')
  }

  init () {
    return
  }

  destroy () {
    return
  }

  trigger (state: TriggerState) {
    this.agent.onTrigger(state, { source: this })
  }
}
