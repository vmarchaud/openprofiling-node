
import {
  GatewayProfilingAgent
} from '../src/index'
import { EventEmitter } from 'events'
import * as assert from 'assert'
import { ProfileType } from '@openprofiling/core'
import { WebsocketGateway, PacketType, Packet, HelloPacket, StartPacket, StopPacket, ProfilePacket } from '@openprofiling/gateway-ws'
import * as WS from 'ws'

class FakeWSClient extends EventEmitter {
  constructor (private sendCallback: Function) {
    super()
  }
  send () {
    return this.sendCallback.apply(this, arguments)
  }
}

describe('Agent Websocket Gateway Test', () => {

  let server = new WebsocketGateway({
    port: 8080
  })
  let client: GatewayProfilingAgent
  let monitor: WS

  after(() => {
    server.destroy()
  })

  it('should create monitor client', (done) => {
    const monitorPacket = Buffer.from(JSON.stringify({
      type: PacketType.MONITOR,
      payload: null
    }))
    monitor = new WS('http://localhost:8080')
    monitor.on('open', () => {
      monitor.send(monitorPacket)
      return done()
    })
    monitor.on('error', done)
  })

  it('should instanciate correctly the client', () => {
    client = new GatewayProfilingAgent()
  })

  it('should connect and receive hello packet', done => {
    monitor.on('message', (data) => {
      const packet = JSON.parse(data.toString()).packet as Packet
      if (packet.type === PacketType.CUSTOM) return
      assert.strictEqual(packet.type, PacketType.HELLO)
      const payload = (packet as HelloPacket).payload
      assert.strictEqual(payload.name, 'dummy')
      monitor.removeAllListeners()
      return done()
    })
    client.start({
      gatewayURI: 'http://localhost:8080',
      metadata: {
        name: 'dummy',
        attributes: {
          test: 1
        }
      }
    })
  })

  it('should start cpu profiler', done => {
    monitor.on('message', (data) => {
      const packet = JSON.parse(data.toString()).packet as Packet
      if (packet.type !== PacketType.START) return
      assert.strictEqual(packet.type, PacketType.START)
      assert.strictEqual((packet as StartPacket).payload.type, ProfileType.CPU_PROFILE)
      monitor.removeAllListeners()
      return done()
    })
    client.startProfiler({
      type: PacketType.START,
      payload: {
        type: ProfileType.CPU_PROFILE
      },
      identifier: 'dummy'
    })
  })

  it('should stop cpu profiler and ', done => {
    monitor.on('message', (data) => {
      const packet = JSON.parse(data.toString()).packet as Packet
      if (packet.type !== PacketType.PROFILE) return
      assert.strictEqual(packet.type, PacketType.PROFILE)
      const profile = (packet as ProfilePacket).payload.profile
      assert.strictEqual(profile.kind, ProfileType.CPU_PROFILE)
      assert(profile.data.toString().length > 10)
      monitor.removeAllListeners()
      return done()
    })
    client.stopProfiler({
      type: PacketType.STOP,
      payload: {
        type: ProfileType.CPU_PROFILE
      },
      identifier: 'dummy'
    })
  })
})
