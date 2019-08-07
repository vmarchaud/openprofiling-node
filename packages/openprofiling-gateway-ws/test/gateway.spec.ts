
import {
  WebsocketGateway,
  PacketType,
  ListPacket,
  Packet,
  StartPacket,
  StopPacket,
  HelloPacket,
  SerializedAgentConnection,
  CustomPacket
} from '../src/index'
import { EventEmitter } from 'events'
import * as assert from 'assert'
import { ProfileType } from '@openprofiling/core'

class FakeWSClient extends EventEmitter {
  constructor (private sendCallback: Function) {
    super()
  }
  send () {
    return this.sendCallback.apply(this, arguments)
  }
}

describe('Websocket Gateway Test', () => {

  let server: WebsocketGateway
  const listPacket = Buffer.from(JSON.stringify({
    type: PacketType.LIST,
    payload: null
  }))
  const monitorPacket = Buffer.from(JSON.stringify({
    type: PacketType.MONITOR,
    payload: null
  }))
  const getStartPacket = (identifier: string) => Buffer.from(JSON.stringify({
    type: PacketType.START,
    payload: {
      type: ProfileType.CPU_PROFILE
    },
    identifier
  }))
  const getStopPacket = (identifier: string) => Buffer.from(JSON.stringify({
    type: PacketType.STOP,
    payload: {},
    identifier
  }))

  after(() => {
    server.destroy()
  })

  it('should instanciate correctly the server', () => {
    server = new WebsocketGateway({ port: 0 })
  })

  it('should process a list packet and return the list', (done) => {
    const fakeClient = new FakeWSClient((data: string) => {
      const msg = JSON.parse(data) as ListPacket
      assert(msg.type === PacketType.LIST)
      assert(msg.payload instanceof Array)
      assert(msg.payload.length > 0)
      fakeClient.emit('close')
      return done()
    })
    // @ts-ignore: used to mock an websocket client
    server.onConnection(fakeClient)
    fakeClient.emit('message', listPacket)
  })

  it('should process a hello packet and save the metadata', (done) => {
    const helloPacket = Buffer.from(JSON.stringify({
      type: PacketType.HELLO,
      payload: {
        name: 'test',
        attributes: {
          server: 'test'
        }
      }
    }))
    const fakeClient = new FakeWSClient((data: string) => {
      const msg = JSON.parse(data) as Packet
      if (msg.type !== PacketType.LIST) return
      const list = msg as ListPacket
      assert(list.payload instanceof Array)
      assert(list.payload.length > 0)
      assert(list.payload[0].metadata.name === 'test')
      assert(list.payload[0].metadata.attributes.server === 'test')
      fakeClient.emit('close')
      return done()
    })
    // @ts-ignore: used to mock an websocket client
    server.onConnection(fakeClient)
    fakeClient.emit('message', helloPacket)
    fakeClient.emit('message', listPacket)
  })

  it('should process and broadcast a start packet', (done) => {
    let identifier: string
    const firstClient = new FakeWSClient((data: string) => {
      const msg = JSON.parse(data) as Packet
      if (msg.type !== PacketType.LIST) return
      const list = msg as ListPacket
      assert(list.payload instanceof Array)
      assert(list.payload.length > 0)
      identifier = list.payload[0].identifier
      firstClient.emit('message', getStartPacket(identifier))
    })
    const secondClient = new FakeWSClient((data: string) => {
      const msg = JSON.parse(data) as Packet
      if (msg.type !== PacketType.START) return
      const start = msg as StartPacket
      assert(start.identifier === identifier)
      assert(start.payload.type === ProfileType.CPU_PROFILE)
      secondClient.emit('close')
      firstClient.emit('close')
      return done()
    })
    // @ts-ignore: used to mock an websocket client
    server.onConnection(secondClient)
    // @ts-ignore: used to mock an websocket client
    server.onConnection(firstClient)
    firstClient.emit('message', listPacket)
  })

  it('should process and broadcast a stop packet', (done) => {
    let identifier: string
    const firstClient = new FakeWSClient((data: string) => {
      const msg = JSON.parse(data) as Packet
      if (msg.type !== PacketType.LIST) return
      const list = msg as ListPacket
      assert(list.payload instanceof Array)
      assert(list.payload.length > 0)
      identifier = list.payload[0].identifier
      firstClient.emit('message', getStopPacket(identifier))
    })
    const secondClient = new FakeWSClient((data: string) => {
      const msg = JSON.parse(data) as Packet
      if (msg.type !== PacketType.STOP) return
      const start = msg as StopPacket
      assert(start.identifier === identifier)
      secondClient.emit('close')
      firstClient.emit('close')
      return done()
    })
    // @ts-ignore: used to mock an websocket client
    server.onConnection(secondClient)
    // @ts-ignore: used to mock an websocket client
    server.onConnection(firstClient)
    firstClient.emit('message', listPacket)
  })

  it('should process monitor packet and broadcast every packet to client', (done) => {
    const helloPacket = Buffer.from(JSON.stringify({
      type: PacketType.HELLO,
      payload: {
        name: 'test',
        attributes: {
          server: 'test'
        }
      }
    }))
    const firstClient = new FakeWSClient((data: string) => {
      const packet = JSON.parse(data)
      // we are only looking for packet from the monitor mode
      if (packet.packet === undefined) return
      const msg = packet.packet as Packet
      const agent = packet.agent as SerializedAgentConnection
      if (msg.type !== PacketType.HELLO) return
      const hello = msg as HelloPacket
      assert(hello.payload.name === 'test')
      assert(hello.payload.attributes.server === 'test')
      firstClient.emit('close')
      secondClient.emit('close')
      return done()
    })
    const secondClient = new FakeWSClient(() => {
      return
    })
    // @ts-ignore: used to mock an websocket client
    server.onConnection(firstClient)
    // @ts-ignore: used to mock an websocket client
    server.onConnection(secondClient)
    firstClient.emit('message', monitorPacket)
    secondClient.emit('message', helloPacket)
  })

  it('should process monitor packet and broadcast connect', (done) => {
    const firstClient = new FakeWSClient((data: string) => {
      const packet = JSON.parse(data)
      // we are only looking for packet from the monitor mode
      if (packet.packet === undefined) return
      const msg = packet.packet as Packet
      const agent = packet.agent as SerializedAgentConnection
      if (msg.type !== PacketType.CUSTOM) return
      const custom = msg as CustomPacket
      assert(custom.payload === 'agent-connect')
      firstClient.emit('close')
      secondClient.emit('close')
      return done()
    })
    const secondClient = new FakeWSClient(() => {
      return
    })
    // @ts-ignore: used to mock an websocket client
    server.onConnection(firstClient)
    firstClient.emit('message', monitorPacket)
    // @ts-ignore: used to mock an websocket client
    server.onConnection(secondClient)
  })

  it('should process monitor packet and broadcast disconnect', (done) => {
    const firstClient = new FakeWSClient((data: string) => {
      const packet = JSON.parse(data)
      // we are only looking for packet from the monitor mode
      if (packet.packet === undefined) return
      const msg = packet.packet as Packet
      const agent = packet.agent as SerializedAgentConnection
      if (msg.type !== PacketType.CUSTOM) return
      const custom = msg as CustomPacket
      assert(custom.payload === 'agent-disconnect')
      firstClient.emit('close')
      return done()
    })
    const secondClient = new FakeWSClient(() => {
      return
    })
    // @ts-ignore: used to mock an websocket client
    server.onConnection(secondClient)
    // @ts-ignore: used to mock an websocket client
    server.onConnection(firstClient)
    firstClient.emit('message', monitorPacket)
    secondClient.emit('close')
  })
})
