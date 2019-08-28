
import * as ws from 'ws'
import { ProfileType, Profile } from '@openprofiling/core'

export enum PacketType {
  LIST,
  START,
  STOP,
  HELLO,
  MONITOR,
  PROFILE,
  CUSTOM
}

export type AgentMetadata = {
  name: string,
  attributes: {
    [key: string]: unknown
  }
}

export enum AgentMode {
  NORMAL,
  MONITOR
}

export type AgentConnection = {
  websocket: ws
  metadata: AgentMetadata
  identifier: string
  mode: AgentMode
}

export type SerializedAgentConnection = {
  metadata: AgentMetadata
  identifier: string
  mode: AgentMode
}

export interface Packet {
  type: PacketType,
  payload: unknown
}

export interface ListPacket extends Packet {
  type: PacketType.LIST,
  payload: SerializedAgentConnection[]
}

export interface HelloPacket extends Packet {
  type: PacketType.HELLO,
  payload: {
    name: string
    attributes: {
      [key: string]: unknown
    }
  }
}

export interface StartPacket extends Packet {
  type: PacketType.START,
  payload: {
    type: ProfileType
  },
  identifier: string
}

export interface ProfilePacket extends Packet {
  type: PacketType.PROFILE,
  payload: {
    profile: Profile
  }
}

export interface StopPacket extends Packet {
  type: PacketType.STOP,
  payload: {
    type: ProfileType
  },
  identifier: string
}

export interface MonitorPacket extends Packet {
  type: PacketType.MONITOR
  payload: {}
}

export interface CustomPacket extends Packet {
  type: PacketType.CUSTOM,
  payload: unknown
}

export type AnyPacket = StopPacket | StartPacket | ListPacket
