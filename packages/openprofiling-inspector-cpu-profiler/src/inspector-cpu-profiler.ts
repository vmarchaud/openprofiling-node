
import { BaseProfiler, Trigger, TriggerState, ProfilerOptions, CoreAgent, Profile, ProfileType, ProfileStatus, TriggerOptions, TriggerEventOptions } from '@openprofiling/core'
import * as inspector from 'inspector'

export interface InspectorCPUProfilerOptions extends ProfilerOptions {
  session?: inspector.Session
}

export class InspectorCPUProfiler extends BaseProfiler {

  private session: inspector.Session | undefined
  private started: boolean = false
  private currentProfile: Profile | undefined

  protected options: InspectorCPUProfilerOptions

  constructor (options?: InspectorCPUProfilerOptions) {
    super('inspector-cpu', options)
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
    this.session.post('Profiler.enable')
  }

  destroy () {
    if (this.session === undefined) return

    if (this.started === true) {
      this.stopProfiling()
    }
    this.session.post('Profiler.disable')
    // if we openned a new session internally, we need to close it
    // as only one session can be openned in node 8
    if (this.options.session === undefined) {
      this.session.disconnect()
    }
  }

  async onTrigger (state: TriggerState, options: TriggerEventOptions) {
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
      this.currentProfile = new Profile(options.name || 'noname', ProfileType.CPU_PROFILE)
      if (options.attributes) {
        this.currentProfile.attributes = options.attributes
      }
      this.started = true
      // start the idle time reporter to tell V8 when node is idle
      // See https://github.com/nodejs/node/issues/19009#issuecomment-403161559.
      if (process.hasOwnProperty('_startProfilerIdleNotifier') === true) {
        (process as any)._startProfilerIdleNotifier()
      }
      this.session.post('Profiler.start')
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
    this.session.post('Profiler.stop', (err, params) => {
      // stop the idle time reporter to tell V8 when node is idle
      // See https://github.com/nodejs/node/issues/19009#issuecomment-403161559.
      if (process.hasOwnProperty('_stopProfilerIdleNotifier') === true) {
        (process as any)._stopProfilerIdleNotifier()
      }

      if (this.currentProfile === undefined) return
      if (err) {
        this.logger.error(`Failed to stop cpu profiler`, err.message)
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
