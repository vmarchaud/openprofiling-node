
import { BaseProfiler, Trigger, TriggerState, ProfilerOptions, Profile, ProfileType, ProfileStatus } from '@openprofiling/core'
import * as inspector from 'inspector'

export class InspectorHeapProfilerOptions implements ProfilerOptions {
  session?: inspector.Session
  /**
   * The less the interval is, the more the profiler is precise and the cost
   * in term of performance is high
   */
  samplingInterval?: number
}
// if we openned a new session internally, we need to close it
// as only one session can be openned in node 8

export class InspectorHeapProfiler extends BaseProfiler {

  private session: inspector.Session | undefined
  private started: boolean = false
  private currentProfile: Profile | undefined

  protected options: InspectorHeapProfilerOptions

  constructor (options?: InspectorHeapProfilerOptions) {
    super('inspector-heap', options)
  }

  init () {
    if (typeof this.options.session === 'object') {
      this.session = this.options.session
      // try to connect the session if not already the case
      try {
        this.session.connect()
      } catch (err) {
        this.logger.debug('failed to connect to given session', err.message)
      }
    } else {
      this.session = new inspector.Session()
      try {
        this.session.connect()
      } catch (err) {
        this.logger.error('Could not connect to inspector', err.message)
        return
      }
    }
    this.session.post('HeapProfiler.enable')
  }

  destroy () {
    if (this.session === undefined) return

    if (this.started === true) {
      this.stopProfiling()
    }
    this.session.post('HeapProfiler.disable')
    // if we openned a new session internally, we need to close it
    // as only one session can be openned in node 8
    if (this.options.session === undefined) {
      this.session.disconnect()
    }
  }

  onTrigger (trigger: Trigger, state: TriggerState) {
    if (this.session === undefined) {
      throw new Error(`Session wasn't initialized`)
    }
    if (state === TriggerState.START && this.started === true) {
      this.logger.info('Received start trigger but already started, ignoring')
      return
    }
    if (state === TriggerState.END && this.started === false) {
      this.logger.error('Received end trigger but wasnt started, ignoring')
      return
    }

    if (state === TriggerState.START) {
      this.logger.info(`Starting profiling`)
      this.currentProfile = new Profile('toto', ProfileType.HEAP_PROFILE)
      this.started = true
      this.session.post('HeapProfiler.startSampling', {
        samplingInterval: typeof this.options.samplingInterval === 'number' ?
          this.options.samplingInterval : 8 * 1024
      })
      this.agent.notifyStartProfile(this.currentProfile)
      return
    }

    if (state === TriggerState.END) {
      this.logger.info(`Stopping profiling`)
      this.stopProfiling()
    }
  }

  private stopProfiling () {
    if (this.session === undefined) {
      throw new Error(`Session wasn't initialized`)
    }
    this.session.post('HeapProfiler.stopSampling', (err, params) => {
      if (this.currentProfile === undefined) return
      if (err) {
        this.logger.error(`Failed to stop Heap profiler`, err.message)
        this.currentProfile.end(err)
      } else {
        const data = JSON.stringify(params.profile)
        this.currentProfile.addProfileData(Buffer.from(data))
        this.currentProfile.addAttribute('profiler', this.name)
        this.currentProfile.end()
      }

      this.agent.notifyEndProfile(this.currentProfile)
      this.started = false
      this.currentProfile = undefined
    })
  }
}
