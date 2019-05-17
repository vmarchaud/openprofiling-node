import { Profiler, ProfilerOptions } from './types'
import { Logger } from '../common/types'
import { CoreAgent } from '../models/agent'
import { TriggerEventOptions, TriggerState } from '../triggers/types'
import { ConsoleLogger } from '../common/console-logger'

export abstract class BaseProfiler implements Profiler {

  protected name: string
  protected logger: Logger
  protected options: ProfilerOptions
  protected agent: CoreAgent

  constructor (name: string, options?: ProfilerOptions) {
    this.name = name
    this.options = options || {}
  }

  enable (agent: CoreAgent) {
    this.agent = agent
    this.logger = new ConsoleLogger({
      level: agent.logger.level,
      namespace: `${this.name}-profiler`
    })
    this.logger.info(`Enabling profiler '${this.name}'`)
    this.init()
  }

  disable () {
    this.logger.info(`Disabling profiler '${this.name}'`)
    this.destroy()
  }

  abstract init (): void
  abstract destroy (): void

  abstract onTrigger (state: TriggerState, options: TriggerEventOptions): Promise<void>
}
