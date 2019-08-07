
import * as ws from 'ws'

import * as types from './types'

type WebsocketGatewayOptions = {
  port: number
}

type Options = WebsocketGatewayOptions & ws.ServerOptions

export class WebsocketGateway {

  private server: ws.Server
  private options: WebsocketGatewayOptions
  private agents: types.AgentConnection[] = []

  constructor (options: Options) {
    this.options = options
    this.server = new ws.Server(options)
    this.server.on('connection', this.onConnection.bind(this))
    console.log(`Listening on port ${this.options.port}`)
  }

  onConnection (ws: ws) {
    const agentConnection: types.AgentConnection = {
      websocket: ws,
      identifier: Math.random().toString(36).substring(2, 15),
      metadata: {
        name: 'unset',
        attributes: {}
      },
      mode: types.AgentMode.NORMAL
    }
    this.agents.push(agentConnection)
    ws.on('ping', _ => ws.pong())
    ws.on('close', () => {
      const index = this.agents.findIndex(agent => agent === agentConnection)
      if (index === -1) return
      this.agents.splice(index, 1)
      // broadcast the disconnect to every monitor agent
      this.agents.filter(agent => agent.mode === types.AgentMode.MONITOR).forEach(agent => {
        agent.websocket.send(JSON.stringify({
          packet: {
            type: types.PacketType.CUSTOM,
            payload: 'agent-disconnect'
          },
          agent: {
            identifier: agent.identifier,
            mode: agent.mode,
            metadata: agent.metadata
          }
        }))
      })
    })
    ws.on('error', _ => ws.close())
    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString()) as types.Packet
        // broadcast every message to agent in monitor mode
        this.agents.filter(agent => agent.mode === types.AgentMode.MONITOR).forEach(agent => {
          agent.websocket.send(JSON.stringify({
            packet: parsed,
            agent: {
              identifier: agent.identifier,
              mode: agent.mode,
              metadata: agent.metadata
            }
          }))
        })
        // then process the PacketType
        switch (parsed.type) {
          case types.PacketType.LIST: {
            return this.list(parsed as types.ListPacket, agentConnection)
          }
          case types.PacketType.START: {
            return this.start(parsed as types.StartPacket, agentConnection)
          }
          case types.PacketType.STOP: {
            return this.stop(parsed as types.StopPacket, agentConnection)
          }
          case types.PacketType.HELLO: {
            return this.hello(parsed as types.HelloPacket, agentConnection)
          }
          case types.PacketType.MONITOR: {
            return this.monitor(parsed as types.MonitorPacket, agentConnection)
          }
        }
      } catch (err) {
        console.error(`Error with parsing msg`, err)
        ws.close()
      }
    })
    // broadcast connection of new agent
    this.agents.filter(agent => agent.mode === types.AgentMode.MONITOR).forEach(agent => {
      agent.websocket.send(JSON.stringify({
        packet: {
          type: types.PacketType.CUSTOM,
          payload: 'agent-connect'
        },
        agent: {
          identifier: agent.identifier,
          mode: agent.mode,
          metadata: agent.metadata
        }
      }))
    })
  }

  list (packet: types.ListPacket, agent: types.AgentConnection) {
    agent.websocket.send(JSON.stringify({
      type: types.PacketType.LIST,
      payload: this.agents.map(agent => {
        return {
          identifier: agent.identifier,
          mode: agent.mode,
          metadata: agent.metadata
        }
      })
    }))
  }

  start (packet: types.StartPacket, agent: types.AgentConnection) {
    const target = this.agents.find(agent => agent.identifier === packet.identifier)
    if (target === undefined) {
      return agent.websocket.send(JSON.stringify({
        type: types.PacketType.START,
        payload: {
          result: 'failed',
          message: `Agent with identifier ${packet.identifier} not found`
        }
      }))
    }
    target.websocket.send(JSON.stringify(packet))
    agent.websocket.send(JSON.stringify({
      type: types.PacketType.START,
      payload: {
        result: 'succedeed',
        message: `Packet broadcasted to agent`
      }
    }))
  }

  stop (packet: types.StopPacket, agent: types.AgentConnection) {
    const target = this.agents.find(agent => agent.identifier === packet.identifier)
    if (target === undefined) {
      return agent.websocket.send(JSON.stringify({
        type: types.PacketType.START,
        payload: {
          result: 'failed',
          message: `Agent with identifier ${packet.identifier} not found`
        }
      }))
    }
    target.websocket.send(JSON.stringify(packet))
    agent.websocket.send(JSON.stringify({
      type: types.PacketType.START,
      payload: {
        result: 'succedeed'
      }
    }))
  }

  hello (packet: types.HelloPacket, agent: types.AgentConnection) {
    agent.metadata = packet.payload
    agent.websocket.send(JSON.stringify({
      type: types.PacketType.HELLO,
      payload: {
        result: 'succedeed'
      }
    }))
  }

  monitor (packet: types.MonitorPacket, agent: types.AgentConnection) {
    agent.mode = types.AgentMode.MONITOR
    agent.websocket.send(JSON.stringify({
      type: types.PacketType.MONITOR,
      payload: {
        result: 'succedeed'
      }
    }))
  }

  destroy () {
    this.server.close()
  }
}
