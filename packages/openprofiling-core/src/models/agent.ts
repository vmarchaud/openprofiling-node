'use strict'

import * as types from './types'
import { Config, Reaction } from './config'
import * as loggerTypes from '../common/types'
import * as logger from '../common/console-logger'
import { Trigger, TriggerState, TriggerEventListener, TriggerEventOptions } from '../triggers/types'

export class CoreAgent implements types.Agent, TriggerEventListener {
  /** Indicates if the tracer is active */
  private activeLocal: boolean
  /** A configuration for starting the tracer */
  private config: Config
  /** A list of end span event listeners */
  private listeners: types.ProfileListener[]
  /** A list of end span event listeners */
  private reactions: Reaction[] = []
  /** A configuration for starting the tracer */
  logger: loggerTypes.Logger = logger.logger(0)

  /** Constructs a new CoreAgent instance. */
  constructor () {
    this.activeLocal = false
  }

  /**
   * Starts a tracer.
   * @param config A tracer configuration object to start a tracer.
   */
  start (config: Config): CoreAgent {
    this.activeLocal = true
    this.config = config
    this.reactions = config.reactions
    this.logger = this.config.logger || logger.logger(config.logLevel || 1)
    this.listeners = []
    return this
  }

  stop (): CoreAgent {
    this.activeLocal = false
    return this
  }

  /** Gets the list of event listeners. */
  get profileListeners (): types.ProfileListener[] {
    return this.listeners
  }

  /** Indicates if the tracer is active or not. */
  get active (): boolean {
    return this.activeLocal
  }

  onTrigger (state: TriggerState, options: TriggerEventOptions): void {
    const reactions = this.reactions.find(reaction => reaction.trigger === options.source)
    if (reactions === undefined) return
    reactions.profiler.onTrigger(state, options)
  }

  registerProfileListener (listener: types.ProfileListener) {
    this.listeners.push(listener)
  }

  unregisterProfileListener (listener: types.ProfileListener) {
    const index = this.listeners.indexOf(listener, 0)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
    return this
  }

  notifyStartProfile (profile: types.Profile) {
    this.logger.debug(`starting to notify listeners the start of ${profile.kind}`)
    if (this.listeners && this.listeners.length > 0) {
      for (const listener of this.listeners) {
        listener.onProfileStart(profile).then(() => {
          this.logger.debug(`succesfully called ${listener}.onProfileStart`)
        }).catch(err => {
          this.logger.error(`Failed to called onProfileStart on ${listener}`, err)
        })
      }
    }
  }

  notifyEndProfile (profile: types.Profile) {
    this.logger.debug(`starting to notify listeners the end of ${profile.kind}`)
    if (this.listeners.length === 0) return

    for (const listener of this.listeners) {
      listener.onProfileEnd(profile).then(() => {
        this.logger.debug(`succesfully called ${listener}.onProfileEnd`)
      }).catch(err => {
        this.logger.error(`Failed to called onProfileEnd on ${listener}`, err)
      })
    }
  }
}
