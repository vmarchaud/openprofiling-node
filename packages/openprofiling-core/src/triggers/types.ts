import { Agent } from '../models/types'

export declare class Trigger {

  constructor (options: TriggerConfig)

  /**
   * Method to enable the trigger
   * @param tracer a agent instance
   */
  enable (tracer: Agent): any
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

/** Called when a trigger fires a change in the state */
export declare class TriggerEventListener {
  onTrigger (trigger: Trigger, state: TriggerState): void
}
