
import * as WS from 'ws'

import { CoreAgent, ProfileListener, Profile, ProfileType, BaseProfiler, TriggerState, BaseTrigger } from '@openprofiling/core'
import { AgentMetadata, StopPacket, StartPacket, Packet, PacketType, HelloPacket } from '@openprofiling/gateway-ws'
import { InspectorCPUProfiler } from '@openprofiling/inspector-cpu-profiler'
import { InspectorHeapProfiler } from '@openprofiling/inspector-heap-profiler'
import { InspectorHeapSnapshot } from '@openprofiling/inspector-heapsnapshot'
import { TraceEventsProfiler } from '@openprofiling/inspector-trace-events'

type AgentConfig = {
  logLevel?: number,
  gatewayURI: string,
  metadata: AgentMetadata
} & WS.ClientOptions

class DummyTrigger extends BaseTrigger {
  constructor () {
    super('gateway-ws-client')
  }

  init () {
    return
  }

  destroy () {
    return
  }
}

export class GatewayProfilingAgent implements ProfileListener {

  private agent: CoreAgent = new CoreAgent()
  private _options: AgentConfig
  private started = false
  private client: WS
  private profilers: Map<ProfileType, BaseProfiler> = new Map()
  private fakeTrigger = new DummyTrigger()

  start (options: AgentConfig): GatewayProfilingAgent {
    this._options = options

    this.client = new WS(options.gatewayURI, options)
    this.client.on('error', (err) => {
      this.agent.logger.error(`Gateway WS error, closing connection for safety`, err)
      this.stop()
    })
    this.client.on('open', () => {
      this.started = true
      this.profilers.set(ProfileType.CPU_PROFILE, new InspectorCPUProfiler())
      this.profilers.set(ProfileType.HEAP_PROFILE, new InspectorHeapProfiler())
      this.profilers.set(ProfileType.HEAP_SNAPSHOT, new InspectorHeapSnapshot())
      this.profilers.set(ProfileType.PERFECTO, new TraceEventsProfiler())
      for (let profiler of this.profilers.values()) {
        profiler.enable(this.agent)
      }
      this.agent.start(Object.assign(options, { reactions: [] }))
      this.agent.registerProfileListener(this)
      this.client.on('message', this.onMessage.bind(this))
      const hello: HelloPacket = {
        type: PacketType.HELLO,
        payload: this._options.metadata
      }
      // send hello world
      this.client.send(JSON.stringify(hello))
    })
    this.client.on('ping', () => this.client.pong())
    this.client.on('close', () => this.stop())
    return this
  }

  onMessage (data: WS.Data) {
    try {
      const parsed = JSON.parse(data.toString()) as Packet
      // then process the PacketType
      switch (parsed.type) {
        case PacketType.START: {
          return this.startProfiler(parsed as StartPacket)
        }
        case PacketType.STOP: {
          return this.stopProfiler(parsed as StopPacket)
        }
      }
    } catch (err) {
      console.error(`Error with parsing msg`, err)
      this.client.close()
    }
  }

  async onProfileEnd (profile: Profile) {
    this.client.send(JSON.stringify({
      type: PacketType.PROFILE,
      payload: {
        profile
      }
    }))
  }

  async onProfileStart (profile: Profile) {
    this.client.send(JSON.stringify({
      type: PacketType.START,
      payload: {
        result: 'succedeed',
        type: profile.kind,
        message: `Profiler ${profile.kind} has been started`
      }
    }))
  }

  startProfiler (packet: StartPacket) {
    const profiler = this.profilers.get(packet.payload.type)
    if (profiler === undefined) {
      this.agent.logger.error(`Received start packet for profiler ${packet.payload.type} but wasn't found`)
      return
    }
    profiler.onTrigger(TriggerState.START, { source: this.fakeTrigger }).then(_ => {
      return
    }).catch(err => {
      console.error(`Error while starting profiler ${packet.payload.type}, stopping agent`, err)
      this.stop()
    })
  }

  stopProfiler (packet: StopPacket) {
    const profiler = this.profilers.get(packet.payload.type)
    if (profiler === undefined) {
      this.agent.logger.error(`Received stop packet for profiler ${packet.payload.type} but wasn't found`)
      return
    }
    profiler.onTrigger(TriggerState.END, { source: this.fakeTrigger }).then(_ => {
      return
    }).catch(err => {
      console.error(`Error while starting profiler ${packet.payload.type}, stopping agent`, err)
      this.stop()
    })
  }

  stop () {
    this.agent.unregisterProfileListener(this)
    this.agent.stop()
    this.started = false
    this.agent.logger.info(`Profiling agent is now stopped.`)
  }

  isStarted () {
    return this.started
  }

}
