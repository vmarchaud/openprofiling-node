
import { BaseProfiler, Trigger, TriggerState, ProfilerOptions, Profile, ProfileType } from '@openprofiling/core'
import * as inspector from 'inspector'

export class InspectorHeapSnapshotOptions implements ProfilerOptions {
  session?: inspector.Session
}
// if we openned a new session internally, we need to close it
// as only one session can be openned in node 8

export class InspectorHeapSnapshot extends BaseProfiler {

  private session: inspector.Session | undefined
  private started: boolean = false
  private currentProfile: Profile | undefined

  protected options: InspectorHeapSnapshotOptions

  constructor (options?: InspectorHeapSnapshotOptions) {
    super('inspector-heapsnapshot', options)
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
      this.logger.error('Received start trigger but already started, ignoring')
      return
    }
    if (state === TriggerState.END) {
      this.logger.error('This profiler doesnt support end trigger, ignoring')
      return
    }

    this.logger.info(`Forcing a garbage collection to only take a snapshot of resident memory`)
    this.session.post('HeapProfiler.collectGarbage')

    this.logger.info(`Starting heapsnapshot`)
    this.currentProfile = new Profile('toto', ProfileType.HEAP_SNAPSHOT)
    this.started = true
    this.agent.notifyStartProfile(this.currentProfile)

    const chunkHandler = (message: any) => {
      if (this.currentProfile === undefined) return
      // append data to profile as soon as we receive them
      const data = message.params as inspector.HeapProfiler.AddHeapSnapshotChunkEventDataType
      this.currentProfile.addProfileData(Buffer.from(data.chunk))
    }
    this.session.on('HeapProfiler.addHeapSnapshotChunk', chunkHandler)
    this.session.post('HeapProfiler.takeHeapSnapshot', {
      reportProgress: false
    }, (err: Error | null) => {
      if (this.session === undefined) return
      // cleanup listener to avoid leaks
      this.session.removeListener('HeapProfiler.addHeapSnapshotChunk', chunkHandler)
      if (this.currentProfile === undefined) return

      this.currentProfile.addAttribute('profiler', this.name)
      this.currentProfile.end(err ? err : undefined)

      if (err) {
        this.logger.error(`Failed to stop Heap snapshot`, err.message)
      }

      this.agent.notifyEndProfile(this.currentProfile)
      this.logger.info('Making a new GC to cleanup allocation made with the snapshot')
      this.session.post('HeapProfiler.collectGarbage')
      this.started = false
      this.currentProfile = undefined
    })
  }
}
