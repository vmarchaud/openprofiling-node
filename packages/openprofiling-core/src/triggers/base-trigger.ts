import { Trigger, TriggerOptions } from './types'
import { Logger } from '../common/types'
import { CoreAgent } from '../models/agent'
import { ConsoleLogger } from '../common/console-logger'

export abstract class BaseTrigger implements Trigger {

  protected name: string
  protected logger: Logger
  protected options: TriggerOptions
  protected agent: CoreAgent

  constructor (name: string, options?: TriggerOptions) {
    this.name = name
    this.options = options || {}
  }

  enable (agent: CoreAgent) {
    this.logger = new ConsoleLogger({
      level: agent.logger.level,
      namespace: `${this.name}-trigger`
    })
    this.agent = agent
    this.logger.info(`Enabling trigger '${this.name}'`)
    this.init()
  }

  disable () {
    this.logger.info(`Disabling trigger '${this.name}'`)
    this.destroy()
  }

  abstract init (): void
  abstract destroy (): void
}
