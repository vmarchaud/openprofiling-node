import { Profiler, ProfilerOptions } from './types'
import { Logger } from '../common/types'
import { CoreAgent } from '../models/agent'
import { Trigger, TriggerState } from '../triggers/types'

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
    this.logger = agent.logger
    this.agent = agent
    this.logger.info(`Enabling profiler '${this.name}'`)
    this.init()
  }

  disable () {
    this.logger.info(`Disabling profiler '${this.name}'`)
    this.destroy()
  }

  abstract init (): void
  abstract destroy (): void

  abstract onTrigger (trigger: Trigger, state: TriggerState): void
}
