import { Agent } from '../models/types'

export interface Trigger {
  /** Name of the trigger */
  name: string
  /**
   * Method to enable the trigger
   * @param tracer a agent instance
   * @param options plugin options
   */
  enable (tracer: Agent, options: TriggerConfig): any
  /** Method to disable the trigger */
  disable (): void
}

export enum TriggerState {
  START = 1,
  END = 0
}

export type TriggerConfig = {
  [key: string]: any;
}

export type NamedTriggerConfig = {
  module: string; config: TriggerConfig;
}

/** Called when a trigger fires a change in the state */
export interface TriggerEventListener {
  onTrigger (trigger: Trigger, state: TriggerState): void
}

/**
 * Type TriggersNames: each key should be the name of the trigger,
 * and its value should be the name of the package  which has the
 * profiler implementation.
 */
export type TriggersNames = {
  [profilerName: string]: string | NamedTriggerConfig;
}
