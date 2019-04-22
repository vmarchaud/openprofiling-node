
import { Profiler } from '../profilers/types'
import { Logger } from '../common/types'
import { Trigger } from '../triggers/types'

export interface Reaction {
  trigger: Trigger
  profiler: Profiler
}

export interface CoreConfig {
  /** level of logger - 0:disable, 1: error, 2: warn, 3: info, 4: debug  */
  logLevel?: number
  /** An instance of a logger  */
  logger?: Logger
  /** List of reaction to apply for a given trigger */
  reactions: Reaction[]
}

export type Config = CoreConfig
