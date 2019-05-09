
import { Exporter, ExporterOptions } from './types'
import { Logger } from '../common/types'
import { CoreAgent } from '../models/agent'
import { ConsoleLogger } from '../common/console-logger'
import { Profile } from '../models/profile'

export abstract class BaseExporter implements Exporter {

  protected name: string
  protected logger: Logger
  protected options: ExporterOptions
  protected agent: CoreAgent

  constructor (name: string, options?: ExporterOptions) {
    this.name = name
    this.options = options || {}
  }

  enable (agent: CoreAgent) {
    this.logger = new ConsoleLogger({
      level: agent.logger.level,
      namespace: `${this.name}-exporter`
    })
    this.agent = agent
    this.logger.info(`Enabling exporter '${this.name}'`)
  }

  disable () {
    this.logger.info(`Disabling exporter '${this.name}'`)
  }

  abstract onProfileEnd (profile: Profile): void
  abstract onProfileStart (profile: Profile): void
}
