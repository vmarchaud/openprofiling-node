
import * as types from './types'
import { Clock } from '../utils/clock'

export class Profile implements types.Profile {

  public data: Buffer
  public name: string
  public kind: types.ProfileType
  public status: types.ProfileStatus
  public attributes: types.Attributes
  /** The clock used to mesure the beginning and ending of a span */
  private clock: Clock

  constructor (name: string, kind: types.ProfileType) {
    this.data = Buffer.alloc(0)
    this.name = name
    this.kind = kind
    this.clock = new Clock()
    this.attributes = {}
    this.status = types.ProfileStatus.UNKNOWN
  }

  addAttribute (key: string, value: string | number | boolean) {
    if (this.ended) {
      throw new Error('You cannot add attributes to ended profile.')
    }
    this.attributes[key] = value
  }

  addProfileData (toAppend: Buffer) {
    this.data = Buffer.concat([ this.data, toAppend ])
  }

  end (err?: Error) {
    this.clock.end()
    if (err instanceof Error) {
      this.status = types.ProfileStatus.FAILED
      this.addAttribute('error', err.message)
    } else {
      this.status = types.ProfileStatus.SUCCESS
    }
  }

  /** Indicates if span was started. */
  get started (): boolean {
    return !!this.clock.startTime
  }

  /** Indicates if span was ended. */
  get ended (): boolean {
    return this.clock.ended
  }

  /**
   * Gives a timestamp that indicates the span's start time in RFC3339 UTC
   * "Zulu" format.
   */
  get startTime (): Date {
    return this.clock.startTime
  }

  /**
   * Gives a timestap that indicates the span's end time in RFC3339 UTC
   * "Zulu" format.
   */
  get endTime (): Date {
    return this.clock.endTime
  }

  /**
   * Gives a timestap that indicates the span's duration in RFC3339 UTC
   * "Zulu" format.
   */
  get duration (): number {
    return this.clock.duration
  }
}
