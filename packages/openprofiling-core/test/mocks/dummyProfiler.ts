
import { Profile, BaseProfiler, TriggerState, ProfileType, TriggerEventOptions } from '../../src'

export class DummyProfiler extends BaseProfiler {
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

  async onTrigger (state: TriggerState, options: TriggerEventOptions) {
    if (state === TriggerState.START) {
      this.currentProfile = new Profile('test', ProfileType.CPU_PROFILE)
      this.agent.notifyStartProfile(this.currentProfile)
    } else {
      this.currentProfile.addProfileData(Buffer.from('test'))
      this.currentProfile.end()
      this.agent.notifyEndProfile(this.currentProfile)
    }
  }
}
