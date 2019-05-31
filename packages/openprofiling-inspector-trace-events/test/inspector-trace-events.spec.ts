
import { TraceEventsProfiler, TraceEvent } from '../src/index'
import * as assert from 'assert'
import * as inspector from 'inspector'
import { readFileSync } from 'fs'
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
    this.agent.onTrigger(state, { source: this })
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

  async onProfileStart (profile) {
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

  async onProfileEnd (profile) {
    if (typeof this.onEnd === 'function') {
      this.onEnd(profile)
    }
  }
}

describe('Inspector Trace Events Profiler', () => {

  const agent: CoreAgent = new CoreAgent()
  let profiler = new TraceEventsProfiler({
    categories: [ 'node.fs.sync' ]
  })
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
    const listener = new DummyExporter(undefined, (profile: Profile) => {
      assert(profile.kind === ProfileType.PERFECTO)
      assert(profile.status === ProfileStatus.SUCCESS)
      assert(profile.data.length > 10)
      const data = JSON.parse(profile.data.toString())
      assert(data.filter(event => event.name === 'fs.sync.open').length === 2)
      agent.unregisterProfileListener(listener)
      return done()
    })
    agent.registerProfileListener(listener)
    readFileSync(__filename)
    trigger.trigger(TriggerState.END)
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

  describe('should pickup gc trace events', () => {
    let session: inspector.Session
    it('should setup use of custom session', () => {
      agent.stop()
      session = new inspector.Session()
      profiler = new TraceEventsProfiler({ session, categories: ['v8.gc'] })
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
      const listener = new DummyExporter(undefined, (profile: Profile) => {
        assert(profile.kind === ProfileType.PERFECTO)
        assert(profile.status === ProfileStatus.SUCCESS)
        assert(profile.data.length > 10)
        const data = JSON.parse(profile.data.toString()) as TraceEvent[]
        const gcEvents = data.filter(event => event.cat !== '_metadata')
        assert(gcEvents.length > 0)
        agent.unregisterProfileListener(listener)
        return done()
      })
      agent.registerProfileListener(listener)
      trigger.trigger(TriggerState.START)
      session.post('HeapProfiler.enable')
      session.post('HeapProfiler.collectGarbage', (err) => {
        assert.ifError(err)
        trigger.trigger(TriggerState.END)
      })
    })
  })

  describe('should pickup deoptimization trace events', () => {
    let session: inspector.Session
    it('should setup use of custom session', () => {
      agent.stop()
      session = new inspector.Session()
      profiler = new TraceEventsProfiler({ session, categories: ['v8.jit'] })
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
      const listener = new DummyExporter(undefined, (profile: Profile) => {
        assert(profile.kind === ProfileType.PERFECTO)
        assert(profile.status === ProfileStatus.SUCCESS)
        assert(profile.data.length > 10)
        const data = JSON.parse(profile.data.toString()) as TraceEvent[]
        const events = data.filter(event => event.name === 'V8.DeoptimizeCode')
        assert(events.length > 0)
        agent.unregisterProfileListener(listener)
        return done()
      })
      agent.registerProfileListener(listener)
      trigger.trigger(TriggerState.START)

      let result = null
      const willBeDeoptimize = function (a, b) {
        return a + b
      }
      // it should jit the function since we are only using number
      for (let i = 0; i < 100000; i++) {
        result = willBeDeoptimize(i, 1)
      }
      // then we use a string, which should deoptimize the function
      willBeDeoptimize('a', 'b')
      trigger.trigger(TriggerState.END)
    })
  })
})
