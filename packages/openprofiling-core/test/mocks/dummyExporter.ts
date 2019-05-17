
import { Profile, BaseExporter } from '../../src'

export type onProfile = (profile: Profile) => void

export class DummyExporter extends BaseExporter {

  private onStart: onProfile | undefined
  private onEnd: onProfile | undefined

  constructor (onStart?: onProfile, onEnd?: onProfile) {
    super('dummy')
    this.onEnd = onEnd
    this.onStart = onStart
  }

  async onProfileStart (profile) {
    if (typeof this.onStart === 'function') {
      this.onStart(profile)
    }
  }

  async onProfileEnd (profile) {
    if (typeof this.onEnd === 'function') {
      this.onEnd(profile)
    }
  }
}
