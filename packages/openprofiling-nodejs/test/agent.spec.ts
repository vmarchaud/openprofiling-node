import { ProfilingAgent } from '../src'
import { TriggerState, Profile, BaseTrigger, Exporter, BaseProfiler, Trigger, ProfileType } from '@openprofiling/core'
import * as assert from 'assert'

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

  enable () {
    return
  }

  disable () {
    return
  }
}

class DummyProfiler extends BaseProfiler {
  private currentProfile: Profile

  constructor () {
    super('dummy-profiler')
  }

  destroy () {
    return
  }

  init () {
    return
  }

  onTrigger (trigger: Trigger, state: TriggerState) {
    if (state === TriggerState.START) {
      this.currentProfile = new Profile('test', ProfileType.CPU_PROFILE)
      this.agent.notifyStartProfile(this.currentProfile)
    } else {
      this.currentProfile.addProfileData(Buffer.from('test'))
      this.agent.notifyEndProfile(this.currentProfile)
    }
  }
}

describe('Agent Integration test', () => {

  let agent = new ProfilingAgent()
  let trigger = new DummyTrigger()
  let profiler = new DummyProfiler()
  let exporter = new DummyExporter()

  it('agent should start', () => {
    agent.register(trigger, profiler)
    assert(agent.isStarted() === false)
    agent.start({
      logLevel: 4,
      exporter
    })
    assert(agent.isStarted() === true)
    assert.throws(() => {
      agent.register(trigger, profiler)
    }, /You cannot register/)
  })

  it('should trigger start and receive start hook in exporter', done => {
    const originalStart = exporter.onProfileStart
    exporter.onProfileStart = (profile: Profile) => {
      assert(profile.name === 'test')
      assert(profile.kind === ProfileType.CPU_PROFILE)
      exporter.onProfileStart = originalStart
      done()
    }
    trigger.trigger(TriggerState.START)
  })

  it('should trigger end and receive end hook in exporter', done => {
    const originalEnd = exporter.onProfileEnd
    exporter.onProfileEnd = (profile: Profile) => {
      assert(profile.name === 'test')
      assert(profile.kind === ProfileType.CPU_PROFILE)
      assert(profile.data.toString() === 'test')
      exporter.onProfileEnd = originalEnd
      done()
    }
    trigger.trigger(TriggerState.END)
  })

  it('should stop the agent and not be able to trigger anything', done => {
    agent.stop()
    assert.doesNotThrow(() => {
      agent.register(trigger, profiler)
    })
    const originalStart = exporter.onProfileStart
    exporter.onProfileStart = (profile: Profile) => {
      assert(false, 'should not be called')
    }
    trigger.trigger(TriggerState.START)
    setTimeout(_ => {
      exporter.onProfileStart = originalStart
      done()
    }, 200)
  })
})
