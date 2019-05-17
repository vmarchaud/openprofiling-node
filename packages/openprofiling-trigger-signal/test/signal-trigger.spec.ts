
import { SignalTrigger } from '../src'
import * as assert from 'assert'
import { CoreAgent, BaseProfiler, TriggerState, Trigger, BaseTrigger, TriggerEventOptions } from '@openprofiling/core'

type onTriggerCallback = (trigger: Trigger, state: TriggerState) => {}

class DummyProfiler extends BaseProfiler {
  constructor () {
    super('dummny-profiler')
  }

  init () {
    return
  }

  destroy () {
    return
  }

  async onTrigger (state: TriggerState, options: TriggerEventOptions) {
    return
  }
}

describe('Signal Trigger', () => {

  const agent: CoreAgent = new CoreAgent()
  const profiler = new DummyProfiler()
  const trigger = new SignalTrigger({ signal: 'SIGUSR1' })

  before(async () => {
    profiler.enable(agent)
    trigger.enable(agent)
    agent.start({
      reactions: [
        {
          profiler,
          trigger
        }
      ],
      logLevel: 4
    })
  })

  it('should export a trigger implementation', () => {
    assert(SignalTrigger.prototype instanceof BaseTrigger)
  })

  it('should receive trigger start inside profiler', (done) => {
    const originalOnTrigger = profiler.onTrigger
    profiler.onTrigger = async function (state, { source }) {
      assert(source === trigger, 'should be http trigger')
      assert(state === TriggerState.START, 'should be starting profile')
      profiler.onTrigger = originalOnTrigger
      return done()
    }
    process.kill(process.pid, 'SIGUSR1')
  })

  it('should receive trigger end inside profiler', (done) => {
    const originalOnTrigger = profiler.onTrigger
    profiler.onTrigger = async function (state, { source }) {
      assert(source === trigger, 'should be the http trigger')
      assert(state === TriggerState.END, 'state should be ending profile')
      profiler.onTrigger = originalOnTrigger
      return done()
    }
    process.kill(process.pid, 'SIGUSR1')
  })

  it('should do nothing with other signal', (done) => {
    const originalOnTrigger = profiler.onTrigger
    profiler.onTrigger = async function (state) {
      assert(false, 'should not receive anything')
    }
    process.on('SIGUSR2', () => {
      profiler.onTrigger = originalOnTrigger
      return done()
    })
    process.kill(process.pid, 'SIGUSR2')
  })

  it('should disable the trigger', (done) => {
    trigger.disable()
    const originalOnTrigger = profiler.onTrigger
    profiler.onTrigger = async function (state) {
      assert(false, 'should not receive anything')
    }
    process.on('SIGUSR1', () => {
      profiler.onTrigger = originalOnTrigger
      return done()
    })
    process.kill(process.pid, 'SIGUSR1')
  })
})
