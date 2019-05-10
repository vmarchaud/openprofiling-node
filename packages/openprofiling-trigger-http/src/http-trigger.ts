'use strict'

import { BaseTrigger, TriggerOptions, TriggerState } from '@openprofiling/core'
import * as http from 'http'

export interface HttpTriggerOptions extends TriggerOptions {
  port?: number
}

export class HttpTrigger extends BaseTrigger {

  private isProfiling: boolean = false
  private server: http.Server

  protected options: HttpTriggerOptions

  constructor (options: HttpTriggerOptions) {
    super(`http-${options.port || 0}`, options)
  }

  init () {
    this.server = http.createServer(this.onRequest.bind(this))
    const port = this.options.port || 0
    this.server.listen(port, () => {
      this.agent.logger.info(`HTTP Trigger is now listening on port ${port}`)
    })
  }

  destroy () {
    this.server.close(err => {
      if (err) {
        this.agent.logger.error(`HTTP Trigger listening on ${this.options.port} has failed to stop`, err)
      } else {
        this.agent.logger.info(`HTTP Trigger that was listening on ${this.options.port} has stopped.`)
      }
    })
  }

  onRequest (req: http.IncomingMessage, res: http.ServerResponse) {
    if (this.isProfiling) {
      this.agent.onTrigger(this, TriggerState.END)
      this.isProfiling = false
    } else {
      this.agent.onTrigger(this, TriggerState.START)
      this.isProfiling = true
    }
    res.writeHead(200)
    return res.end()
  }

}
