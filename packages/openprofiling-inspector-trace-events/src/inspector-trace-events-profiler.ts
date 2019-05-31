
import { BaseProfiler, TriggerState, ProfilerOptions, Profile, ProfileType, ProfileStatus, TriggerEventOptions } from '@openprofiling/core'
import * as inspector from 'inspector'

export type TraceEventsCategories = 'node.fs.sync' | 'v8.gc' | 'v8.runtime' | 'node.bootstrap' | 'v8.jit' | 'v8.compile'

export class TraceEventsProfilerOptions implements ProfilerOptions {
  session?: inspector.Session
  categories?: TraceEventsCategories[]
}

export type TraceEvent = {
  pid: Number
  tid: Number
  ts: Number
  tts: Number
  name: String
  cat: String
  dur: Number
  tdur: Number
  args: Object
}

export type TraceEventsCollection = {
  value: TraceEvent[]
}

export type TraceEventsCollected = {
  method: String,
  params: TraceEventsCollection
}

export class TraceEventsProfiler extends BaseProfiler {

  private session: inspector.Session | undefined
  private started: boolean = false
  private currentProfile: Profile | undefined

  protected options: TraceEventsProfilerOptions
  private categories: Set<string> = new Set([
    'node.bootstrap', 'v8.gc', 'v8.jit'
  ])

  constructor (options?: TraceEventsProfilerOptions) {
    super('inspector-trace-events', options)
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
    if (this.options.categories !== undefined && this.options.categories.length > 0) {
      this.categories = new Set(this.options.categories)
    }
    for (let category of this.categories) {
      switch (category) {
        case 'v8.gc': {
          this.categories.add('disabled-by-default-v8.gc_stats')
          this.categories.add('disabled-by-default-v8.gc')
          break
        }
        case 'v8.jit': {
          this.categories.add('disabled-by-default-v8.ic_stats')
          this.categories.add('v8')
          this.categories.add('V8.DeoptimizeCode')
          break
        }
        case 'v8.runtime': {
          this.categories.add('disabled-by-default-v8.runtime_stats')
          this.categories.add('disabled-by-default-v8.runtime')
          this.categories.add('v8.execute')
          break
        }
        case 'v8.compile': {
          this.categories.add('disabled-by-default-v8.compile')
          this.categories.add('v8')
          this.categories.add('v8.compile')
          break
        }
      }
    }
  }

  destroy () {
    if (this.session === undefined) return

    if (this.started === true) {
      this.stopProfiling()
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
      this.currentProfile = new Profile(options.name || 'noname', ProfileType.PERFECTO)
      this.started = true
      this.session.post('NodeTracing.start', {
        traceConfig: {
          includedCategories: Array.from(this.categories)
        }
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
    const buffer: TraceEvent[] = []
    const onDataCollected = (message: TraceEventsCollected) => {
      const data = message.params.value
      buffer.push(...data)
    }
    const onTracingComplete = () => {
      if (this.session === undefined) return
      // cleanup listeners
      this.session.removeListener('NodeTracing.dataCollected', onDataCollected)
      this.session.removeListener('NodeTracing.tracingComplete', onTracingComplete)

      if (this.currentProfile === undefined) return

      // serialize buffer
      const data = JSON.stringify(buffer)
      this.currentProfile.addProfileData(Buffer.from(data))
      this.currentProfile.status = ProfileStatus.SUCCESS
      this.currentProfile.addAttribute('profiler', this.name)
      this.agent.notifyEndProfile(this.currentProfile)
      this.started = false
      this.currentProfile = undefined
    }

    this.session.on('NodeTracing.dataCollected', onDataCollected)
    this.session.on('NodeTracing.tracingComplete', onTracingComplete)
    this.session.post('NodeTracing.stop', {
      traceConfig: {
        includedCategories: Array.from(this.categories)
      }
    }, (err, args) => {
      if (err && this.currentProfile !== undefined) {
        this.logger.error(`Failed to stop trace events profiler`, err.message)
        this.currentProfile.status = ProfileStatus.FAILED
        this.currentProfile.addAttribute('error', err.message)
      }
    })
  }
}
