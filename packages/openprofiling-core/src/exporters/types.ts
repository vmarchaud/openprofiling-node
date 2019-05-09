import { ProfileListener, Agent } from '../models/types'

/** Defines a exporter interface. */
export interface Exporter extends ProfileListener {
  /**
   * Method to enable the exporter
   *
   * @param agent a agent instance
   */
  enable (agent: Agent): void
  /** Method to disable the exporter */
  disable (): void
}

export type ExporterOptions = {
  [key: string]: any
}
