
import * as util from 'util'
import * as types from './types'

/**
 * This class implements a console logger.
 */
export class ConsoleLogger implements types.Logger {

  static LEVELS = ['silent', 'error', 'warn', 'info', 'debug']
  public level: string
  private namespace: string = 'core'

  /**
   * Constructs a new ConsoleLogger instance
   * @param options A logger configuration object.
   */
  constructor (options?: types.LoggerOptions | string | number) {
    let opt: types.LoggerOptions = {}
    if (typeof options === 'number') {
      if (options < 0) {
        options = 0
      } else if (options > ConsoleLogger.LEVELS.length) {
        options = ConsoleLogger.LEVELS.length - 1
      }
      opt = { level: ConsoleLogger.LEVELS[options] }
    } else if (typeof options === 'string') {
      opt = { level: options }
    } else {
      opt = options || {}
    }
    this.level = opt.level || 'error'
    if (typeof options === 'object' && options.namespace) {
      this.namespace = options.namespace
    }
  }

  /**
   * Logger error function.
   * @param message menssage erro to log in console
   * @param args arguments to log in console
   */
  // tslint:disable-next-line:no-any
  error (message: any, ...args: any[]): void {
    if (ConsoleLogger.LEVELS.indexOf(this.level) < 1) return
    console.log(`${new Date().toISOString()} - ${this.namespace} - ERROR - ${util.format(message, ...args)}`)
  }

  /**
   * Logger warning function.
   * @param message menssage warning to log in console
   * @param args arguments to log in console
   */
  // tslint:disable-next-line:no-any
  warn (message: any, ...args: any[]): void {
    if (ConsoleLogger.LEVELS.indexOf(this.level) < 2) return
    console.log(`${new Date().toISOString()} - ${this.namespace} - WARN - ${util.format(message, ...args)}`)
  }

  /**
   * Logger info function.
   * @param message menssage info to log in console
   * @param args arguments to log in console
   */
  // tslint:disable-next-line:no-any
  info (message: any, ...args: any[]): void {
    if (ConsoleLogger.LEVELS.indexOf(this.level) < 3) return
    console.log(`${new Date().toISOString()} - ${this.namespace} - INFO - ${util.format(message, ...args)}`)
  }

  /**
   * Logger debug function.
   * @param message menssage debug to log in console
   * @param args arguments to log in console
   */
  // tslint:disable-next-line:no-any
  debug (message: any, ...args: any[]): void {
    if (ConsoleLogger.LEVELS.indexOf(this.level) < 4) return
    console.log(`${new Date().toISOString()} - ${this.namespace} - DEBUG - ${util.format(message, ...args)}`)
  }
}

/**
 * Function logger exported to others classes. Inspired by:
 * https://github.com/cainus/logdriver/blob/bba1761737ca72f04d6b445629848538d038484a/index.js#L50
 * @param options A logger options or strig to logger in console
 */
const logger = (options?: types.LoggerOptions | string | number): types.Logger => {
  return new ConsoleLogger(options)
}

export { logger }
