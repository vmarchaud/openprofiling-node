import { CoreAgent, Profile, TriggerState, ProfileStatus } from '../src'
import * as assert from 'assert'
import { DummyTrigger } from './mocks/dummyTrigger'
import { DummyProfiler } from './mocks/dummyProfiler'

describe('Core Agent implementation', () => {

  let agent: CoreAgent
  let trigger = new DummyTrigger()
  let profiler = new DummyProfiler()

  it('should instanciate agent', () => {
    assert.doesNotThrow(() => {
      agent = new CoreAgent()
    })
    assert(agent.active === false, 'should not be active')
    trigger.enable(agent)
    profiler.enable(agent)
  })

  it('should correctly start the agent', () => {
    const reactions = [{
      trigger, profiler
    }]
    assert.doesNotThrow(() => {
      const result = agent.start({ reactions })
      assert(result === agent)
      assert(agent.active === true, 'should be active')
    })
  })

  it('should trigger via dummy trigger', (done) => {
    const handler = {
      onProfileStart: (profile: Profile) => {
        assert(profile instanceof Profile)
        assert(profile.ended === false)
        assert.doesNotThrow(() => {
          profile.addAttribute('test', true)
        })
        assert(profile.started === true)
        assert(profile.data.length === 0)
        assert(profile.status === ProfileStatus.UNKNOWN)
        agent.unregisterProfileListener(handler)
        return done()
      },
      onProfileEnd: (profile: Profile) => {
        return
      }
    }
    agent.registerProfileListener(handler)
    assert(agent.profileListeners.length === 1)
    trigger.trigger(TriggerState.START)
  })

  it('should end profile via dummy trigger', (done) => {
    const handler = {
      onProfileStart: (profile: Profile) => {
        return
      },
      onProfileEnd: (profile: Profile) => {
        assert(profile instanceof Profile)
        assert(profile.ended === true)
        assert.throws(() => {
          profile.addAttribute('test', true)
        })
        assert(profile.data.toString() === 'test')
        assert(profile.status === ProfileStatus.SUCCESS)
        agent.unregisterProfileListener(handler)
        return done()
      }
    }
    agent.registerProfileListener(handler)
    assert(agent.profileListeners.length === 1)
    trigger.trigger(TriggerState.END)
  })

  it('should stop agent', () => {
    assert.doesNotThrow(() => {
      const result = agent.stop()
      assert(result === agent)
      assert(agent.active === false)
    })
  })
})
