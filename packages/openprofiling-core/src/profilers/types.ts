import { Agent } from '../models/types'
import { TriggerEventListener } from '../triggers/types'

export interface Profiler extends TriggerEventListener {
  /**
   * Method to enable the profiler
   *
   * @param agent a agent instance
   */
  enable (agent: Agent): void
  /** Method to disable the profiler */
  disable (): void
}

export type ProfilerOptions = {
  [key: string]: any
}
