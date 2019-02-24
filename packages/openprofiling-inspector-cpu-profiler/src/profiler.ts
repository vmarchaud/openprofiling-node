
import { Profiler, Trigger, TriggerState, ProfilerConfig, CoreAgent, Profile, ProfileType, ProfileStatus } from '../../openprofiling-core'
import * as inspector from 'inspector'

export class InspectorCPUProfilerOptions implements ProfilerConfig {
  session: inspector.Session
}

export class InspectorCPUProfiler implements Profiler {

  private session: inspector.Session | undefined
  private started: boolean = false
  private currentProfile: Profile | undefined
  private tracer: CoreAgent
  private PROFILER_NAME: string = 'inspector-cpu'

  enable (tracer: CoreAgent, options: InspectorCPUProfilerOptions) {
    this.tracer = tracer

    // tslint:disable-next-line
    if (typeof options.session === 'object') {
      this.session = options.session
      // try to connect the session if not already the case
      try {
        this.session.connect()
      } catch (err) {
        tracer.logger.debug('failed to connect to given session', err.message)
      }
    } else {
      this.session = new inspector.Session()
      try {
        this.session.connect()
      } catch (err) {
        tracer.logger.error('Could not connect to inspector', err.message)
        return
      }
    }
    this.tracer.logger.debug('enabling inspector based cpu profiler')
    this.session.post('Profiler.enable')
  }

  disable () {
    this.tracer.logger.debug('disabling inspector based cpu profiler')
    if (this.session === undefined) return

    if (this.started === true) {
      this.stopProfiling()
    }
    this.session.post('Profiler.disable')
  }

  onTrigger (trigger: Trigger, state: TriggerState) {
    if (this.session === undefined) {
      throw new Error(`Session wasn't initialized`)
    }
    if (state === TriggerState.START && this.started === true) {
      return this.tracer.logger.info('Received start trigger but already started, ignoring')
    }
    if (state === TriggerState.END && this.started === false) {
      return this.tracer.logger.error('Received end trigger but wasnt started, ignoring')
    }

    if (state === TriggerState.START) {
      this.tracer.logger.info(`Starting profiling from trigger ${trigger.name}`)
      this.currentProfile = new Profile('toto', ProfileType.CPU_PROFILE)
      this.started = true
      this.session.post('Profiler.start')
      return this.tracer.notifyStartProfile(this.currentProfile)
    }

    if (state === TriggerState.END) {
      this.tracer.logger.info(`Stopping profiling from trigger ${trigger.name}`)
      this.stopProfiling()
    }
  }

  private stopProfiling () {
    if (this.session === undefined) {
      throw new Error(`Session wasn't initialized`)
    }
    this.session.post('Profiler.stop', (err, params) => {
      if (this.currentProfile === undefined) return
      if (err) {
        this.tracer.logger.error(`Failed to stop cpu profiler`, err.message)
        this.currentProfile.status = ProfileStatus.FAILED
        this.currentProfile.addAttribute('error', err.message)
      } else {
        const data = JSON.stringify(params.profile)
        this.currentProfile.addProfileData(Buffer.from(data))
        this.currentProfile.status = ProfileStatus.SUCCESS
        this.currentProfile.addAttribute('profiler', this.PROFILER_NAME)
      }

      this.tracer.notifyEndProfile(this.currentProfile)
      this.started = false
      this.currentProfile = undefined
    })
  }
}
