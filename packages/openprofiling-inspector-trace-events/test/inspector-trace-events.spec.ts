
import { TraceEventsProfiler } from '../src/index'
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

  onProfileEnd (profile) {
    if (typeof this.onEnd === 'function') {
      this.onEnd(profile)
    }
  }
}

const generateAsyncWork = async () => {
  function generateTrace() {
    return new Promise((resolve) => setTimeout(() => {
      for (let i = 0; i < 10000; i++) {
        let toto = 'test' + i.toString()
      }
      resolve();
    }, 1));
  }
  for (let i = 0; i < 10; i++) {
    console.log('generateTrace')
    await generateTrace()
  }
}

describe('Inspector Trace Events Profiler', () => {

  const agent: CoreAgent = new CoreAgent()
  let profiler = new TraceEventsProfiler({})
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
    assert(TraceEventsProfiler.prototype instanceof BaseProfiler)
  })

  it('should receive profile start from profiler', (done) => {
    const listener = new DummyExporter(profile => {
      assert(profile.kind === ProfileType.PERFECTO)
      assert(profile.status === ProfileStatus.UNKNOWN)
      agent.unregisterProfileListener(listener)
      return done()
    })
    agent.registerProfileListener(listener)
    trigger.trigger(TriggerState.START)
  })

  it('should receive profile end from profiler', (done) => {
    const listener = new DummyExporter(undefined, profile => {
      assert(profile.kind === ProfileType.PERFECTO)
      assert(profile.status === ProfileStatus.SUCCESS)
      console.log(profile.data.toString())
      assert(profile.data.length > 10)
      agent.unregisterProfileListener(listener)
      return done()
    })
    agent.registerProfileListener(listener)
    generateAsyncWork().then(_ => {
      trigger.trigger(TriggerState.END)
    }).catch()
  })

  it('should stop profile if profiler is destroyed', (done) => {
    const listener = new DummyExporter(undefined, profile => {
      assert(profile.kind === ProfileType.PERFECTO)
      assert(profile.status === ProfileStatus.SUCCESS)
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
    it('should setup use of custom session', () => {
      agent.stop()
      const session = new inspector.Session()
      session.connect()
      profiler = new TraceEventsProfiler({ session })
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
        assert(profile.kind === ProfileType.PERFECTO)
        assert(profile.status === ProfileStatus.SUCCESS)
        agent.unregisterProfileListener(listener)
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
    it('should setup use of custom session', () => {
      agent.stop()
      const session = new inspector.Session()
      profiler = new TraceEventsProfiler({ session })
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
        assert(profile.kind === ProfileType.PERFECTO)
        assert(profile.status === ProfileStatus.SUCCESS)
        agent.unregisterProfileListener(listener)
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
