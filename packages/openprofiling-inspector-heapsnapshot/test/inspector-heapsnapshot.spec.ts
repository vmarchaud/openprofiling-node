
import * as semver from 'semver'

if (semver.lt(process.versions.node, '8.0.0') || semver.gte(process.versions.node, '11.0.0')) {
  console.log('not available for node 6 or node starting 11')
  process.exit(0)
}

import { InspectorHeapSnapshot } from '../src'
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

  async destroy () {
    return
  }

  async trigger (state: TriggerState) {
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

describe('Inspector Heap Snapshot', () => {

  const agent: CoreAgent = new CoreAgent()
  let profiler = new InspectorHeapSnapshot({})
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
    assert(InspectorHeapSnapshot.prototype instanceof BaseProfiler)
  })

  it('should receive profile start from profiler', function (done) {
    this.timeout(30000)
    let onStartHasBeenCalled = false
    const listener = new DummyExporter((profile: Profile) => {
      assert(profile.kind === ProfileType.HEAP_SNAPSHOT)
      assert(profile.status === ProfileStatus.UNKNOWN)
      assert(profile.ended === false)
      console.log(`RSS Usage before heapsnapshot : ${process.memoryUsage().rss} bytes`)
      onStartHasBeenCalled = true
    }, (profile => {
      assert(profile.kind === ProfileType.HEAP_SNAPSHOT)
      assert(profile.status === ProfileStatus.SUCCESS)
      assert(profile.ended === true)
      assert(profile.data.length > 10)
      console.log(`HeapSnapshot size : ${profile.data.length} bytes`)
      console.log(`RSS Usage after heapsnapshot : ${process.memoryUsage().rss} bytes`)
      assert(onStartHasBeenCalled === true)
      agent.unregisterProfileListener(listener)
      profiler.disable()
      return done()
    }))
    agent.registerProfileListener(listener)
    trigger.trigger(TriggerState.START)
  })

  describe('should work with custom inspector session', () => {
    let session: inspector.Session

    it('should setup use of custom session', () => {
      agent.stop()
      session = new inspector.Session()
      session.connect()
      profiler = new InspectorHeapSnapshot({ session })
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

    it('should take a profile succesfully', function (done) {
      this.timeout(30000)
      const listener = new DummyExporter(undefined, profile => {
        assert(profile.kind === ProfileType.HEAP_SNAPSHOT)
        assert(profile.status === ProfileStatus.SUCCESS)
        assert(profile.data.length > 10)
        agent.unregisterProfileListener(listener)
        // see https://github.com/nodejs/node/issues/27641
        setImmediate(_ => {
          session.disconnect()
        })
        return done()
      })
      agent.registerProfileListener(listener)
      trigger.trigger(TriggerState.START)
    })
  })

  describe('should work with custom inspector session (not opened)', () => {
    let session: inspector.Session

    it('should setup use of custom session', () => {
      agent.stop()
      session = new inspector.Session()
      profiler = new InspectorHeapSnapshot({ session })
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

    it('should take a profile succesfully', function (done) {
      this.timeout(30000)
      const listener = new DummyExporter(undefined, profile => {
        assert(profile.kind === ProfileType.HEAP_SNAPSHOT)
        assert(profile.status === ProfileStatus.SUCCESS)
        assert(profile.data.length > 10)
        agent.unregisterProfileListener(listener)
        // see https://github.com/nodejs/node/issues/27641
        setImmediate(_ => {
          session.disconnect()
        })
        return done()
      })
      agent.registerProfileListener(listener)
      trigger.trigger(TriggerState.START)
    })
  })
})
