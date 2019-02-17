import { Agent } from '../models/types'
import { TriggerEventListener } from '../triggers/types'

export interface Profiler extends TriggerEventListener {
  /**
   * Method to enable the profiler
   *
   * @param tracer a agent instance
   * @param options plugin options
   */
  enable(tracer: Agent, options: ProfilerConfig): any
  /** Method to disable the profiler */
  disable(): void
}

export type ProfilerConfig = {
  [key: string]: any
};

export type NamedProfilerConfig = {
  module: string; config: ProfilerConfig
};

/**
 * Type ProfilerNames: each key should be the name of the profiler,
 * and its value should be the name of the package  which has the
 * profiler implementation.
 */
export type ProfilerNames = {
  [profilerName: string]: string | NamedProfilerConfig
};