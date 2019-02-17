
import * as types from './types'
import { Config } from './config'
import * as loggerTypes from '../common/types';
import * as logger from '../common/console-logger'
import {Profiler} from '../profilers/types';
import { TriggerEventListener, Trigger, TriggerState } from '../triggers/types'

export class CoreAgent implements types.Agent, TriggerEventListener {

  /** Indicates if the tracer is active */
  private activeLocal: boolean
  /** A configuration for starting the tracer */
  private config: Config;
  /** A list of availables profilers */
  private profilers: Profiler[]
  /** A list of end span event listeners */
  private listeners: types.ProfileListener[]
  /** A list of reactions to execute for a given trigger */
  /** A configuration for starting the tracer */
  logger: loggerTypes.Logger = logger.logger()

  /** Constructs a new AgentProfile instance. */
  constructor() {
    this.activeLocal = false
  }

  /**
   * Starts a tracer.
   * @param config A tracer configuration object to start a tracer.
   */
  start (config: Config): types.Agent {
    this.activeLocal = true;
    this.config = config;
    this.logger = this.config.logger || logger.logger()
    return this;
  }

  /** Stops the tracer. */
  stop (): types.Agent {
    this.activeLocal = false;
    return this;
  }

  /** Gets the list of event listeners. */
  get profileListeners (): types.ProfileListener[] {
    return this.listeners;
  }

  /** Indicates if the tracer is active or not. */
  get active (): boolean {
    return this.activeLocal;
  }

  /** Called when a trigger need to propagate an action to a profiler */
  onTrigger (trigger: Trigger, state: TriggerState): void {
    const rules = trigger
  }

  /**
   * Registers an end span event listener.
   * @param listener The listener to register.
   */
  registerProfileListener (listener: types.ProfileListener) {
    this.listeners.push(listener);
  }

  /**
   * Unregisters an end span event listener.
   * @param listener The listener to unregister.
   */
  unregisterProfileListener (listener: types.ProfileListener) {
    const index = this.listeners.indexOf(listener, 0);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify profile listener that a new profile has been created
   * @param profile a profile to broadcast to exporters
   */
  notifyStartProfile (profile: types.Profile) {
    this.logger.debug('starting to notify listeners the start of');
    if (this.listeners && this.listeners.length > 0) {
      for (const listener of this.listeners) {
        listener.onProfileStart(profile);
      }
    }
  }

  /**
   * Notify profile listener that a profile has been completed
   * @param profile a profile to broadcast to exporters
   */
  notifyEndProfile (profile: types.Profile) {
    if (this.active) {
      this.logger.debug('starting to notify listeners the end of rootspans');
      if (this.listeners && this.listeners.length > 0) {
        for (const listener of this.listeners) {
          listener.onProfileEnd(profile);
        }
      }
    } else {
      this.logger.debug('this tracer is inactivate cant notify');
    }
  }
}