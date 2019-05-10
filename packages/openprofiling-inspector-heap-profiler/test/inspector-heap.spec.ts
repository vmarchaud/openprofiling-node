
if (process.version[1] === '6') {
  console.log('Inspector is not available for node 6')
  process.exit(0)
}

import { InspectorHeapProfiler } from '../src'
import * as assert from 'assert'
import * as inspector from 'inspector'
import { CoreAgent, BaseProfiler, TriggerState, Profile, BaseTrigger, Exporter, ProfileType, ProfileStatus } from '@openprofiling/core'

class DummyTrigger extends BaseTrigger {
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
    this.agent.onTrigger(this, state)
  }
}

type onProfile = (profile: Profile) => void

class DummyExporter implements Exporter {

  private onStart: onProfile | undefined
  private onEnd: onProfile | undefined

  constructor (onStart?: onProfile, onEnd?: onProfile) {
    this.onEnd = onEnd
    this.onStart = onStart
  }

  onProfileStart (profile) {
    if (typeof this.onStart === 'function') {
      this.onStart(profile)
    }
  }

  enable () {
    return
  }

  disable () {
    return
  }

  onProfileEnd (profile) {
    if (typeof this.onEnd === 'function') {
      this.onEnd(profile)
    }
  }
}

describe('Inspector Heap Profiler', () => {

  const agent: CoreAgent = new CoreAgent()
  let profiler = new InspectorHeapProfiler({})
  const trigger = new DummyTrigger()

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

  it('should export a profiler implementation', () => {
    assert(InspectorHeapProfiler.prototype instanceof BaseProfiler)
  })

  it('should receive profile start from profiler', (done) => {
    const listener = new DummyExporter((profile: Profile) => {
      assert(profile.kind === ProfileType.HEAP_PROFILE)
      assert(profile.status === ProfileStatus.UNKNOWN)
      assert(profile.ended === false)
      agent.unregisterProfileListener(listener)
      return done()
    })
    agent.registerProfileListener(listener)
    trigger.trigger(TriggerState.START)
  })

  it('should receive profile end from profiler', (done) => {
    const listener = new DummyExporter(undefined, profile => {
      assert(profile.kind === ProfileType.HEAP_PROFILE)
      assert(profile.status === ProfileStatus.SUCCESS)
      assert(profile.ended === true)
      assert(profile.data.length > 10)
      agent.unregisterProfileListener(listener)
      return done()
    })
    agent.registerProfileListener(listener)
    trigger.trigger(TriggerState.END)
  })

  it('should stop profile if profiler is destroyed', (done) => {
    const listener = new DummyExporter(undefined, profile => {
      assert(profile.kind === ProfileType.HEAP_PROFILE)
      assert(profile.status === ProfileStatus.SUCCESS)
      assert(profile.ended === true)
      agent.unregisterProfileListener(listener)
      return done()
    })
    agent.registerProfileListener(listener)
    trigger.trigger(TriggerState.START)
    setTimeout(_ => {
      profiler.disable()
    }, 100)
  })

  describe('should work with custom inspector session', () => {
    let session: inspector.Session

    it('should setup use of custom session', () => {
      agent.stop()
      session = new inspector.Session()
      session.connect()
      profiler = new InspectorHeapProfiler({ session })
      profiler.enable(agent)
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

    it('should take a profile succesfully', (done) => {
      const listener = new DummyExporter(undefined, profile => {
        assert(profile.kind === ProfileType.HEAP_PROFILE)
        assert(profile.status === ProfileStatus.SUCCESS)
        agent.unregisterProfileListener(listener)
        // see https://github.com/nodejs/node/issues/27641
        setImmediate(_ => {
          session.disconnect()
        })
        return done()
      })
      agent.registerProfileListener(listener)
      trigger.trigger(TriggerState.START)
      setTimeout(_ => {
        trigger.trigger(TriggerState.END)
      }, 100)
    })
  })

  describe('should work with custom inspector session (not opened)', () => {
    let session: inspector.Session

    it('should setup use of custom session', () => {
      agent.stop()
      session = new inspector.Session()
      profiler = new InspectorHeapProfiler({ session })
      profiler.enable(agent)
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

    it('should take a profile succesfully', (done) => {
      const listener = new DummyExporter(undefined, profile => {
        assert(profile.kind === ProfileType.HEAP_PROFILE)
        assert(profile.status === ProfileStatus.SUCCESS)
        agent.unregisterProfileListener(listener)
        // see https://github.com/nodejs/node/issues/27641
        setImmediate(_ => {
          session.disconnect()
        })
        return done()
      })
      agent.registerProfileListener(listener)
      trigger.trigger(TriggerState.START)
      setTimeout(_ => {
        trigger.trigger(TriggerState.END)
      }, 100)
    })
  })
})
