
import { HttpTrigger } from '../src'
import * as assert from 'assert'
import * as http from 'http'
import { CoreAgent, BaseProfiler, TriggerState, Trigger, BaseTrigger } from '@openprofiling/core'

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

  onTrigger (trigger: Trigger, state: TriggerState) {
    return
  }
}

describe('Http Trigger', () => {

  const agent: CoreAgent = new CoreAgent()
  const profiler = new DummyProfiler()
  const trigger = new HttpTrigger({ port: 4242 })

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
    assert(HttpTrigger.prototype instanceof BaseTrigger)
  })

  it('should receive trigger start inside profiler', (done) => {
    const originalOnTrigger = profiler.onTrigger
    profiler.onTrigger = function (_trigger, state) {
      assert(trigger === trigger, 'should be http trigger')
      assert(state === TriggerState.START, 'should be starting profile')
      profiler.onTrigger = originalOnTrigger
      return done()
    }
    http.get('http://localhost:4242/')
  })

  it('should receive trigger end inside profiler', (done) => {
    const originalOnTrigger = profiler.onTrigger
    profiler.onTrigger = function (_trigger, state) {
      assert(trigger === trigger, 'should be the http trigger')
      assert(state === TriggerState.END, 'state should be ending profile')
      profiler.onTrigger = originalOnTrigger
      return done()
    }
    http.get('http://localhost:4242/')
  })

  it('should disable the trigger', (done) => {
    trigger.disable()
    const req = http.get('http://localhost:4242/')
    req.on('error', err => {
      // @ts-ignore
      assert(err.code === 'ECONNREFUSED', 'server should have been stopped')
      return done()
    })
  })
})
