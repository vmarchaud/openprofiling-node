import { Agent } from '../models/types'

export interface Trigger {
  /**
   * Method to enable the trigger
   * @param agent a agent instance
   */
  enable (agent: Agent): void
  /** Method to disable the trigger */
  disable (): void
}

export enum TriggerState {
  START = 1,
  END = 0
}

export type TriggerOptions = {
  [key: string]: string | number | boolean | undefined;
}

/** Called when a trigger fires a change in the state */
export interface TriggerEventListener {
  onTrigger (trigger: Trigger, state: TriggerState): void
}
