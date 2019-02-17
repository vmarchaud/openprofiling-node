
import { ProfilerNames, Profiler } from '../profilers/types'
import { Logger } from '../common/types'
import { TriggersNames, Trigger } from '../triggers/types'
import { Exporter } from '../exporters/types'

export interface CoreConfig {
  /** level of logger - 0:disable, 1: error, 2: warn, 3: info, 4: debug  */
  logLevel?: number;
  /** An exporter object */
  exporter?: Exporter;
  /** An instance of a logger  */
  logger?: Logger;
  
  reactions: {
    [trigger: Trigger]: Profiler[]
  }
}

export type Config = AgentConfig