import pino from 'pino';

// declare module 'logging' {
export interface Logger {
  /**
   * Set the level of the logger.
   */
  setLevel(level: pino.Level): this;

  /**
   * Get the current level of the logger.
   */
  getLevel(): pino.Level;

  /**
   * Log at `'fatal'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  fatal: pino.LogFn;

  /**
   * Log at `'error'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  error: pino.LogFn;

  /**
   * Log at `'warn'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  warn: pino.LogFn;

  /**
   * Log at `'info'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  info: pino.LogFn;

  /**
   * Log at `'debug'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  debug: pino.LogFn;

  /**
   * Log at `'trace'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  trace: pino.LogFn;

  /**
   * Noop function.
   */
  silent: pino.LogFn;

  /**
   * Flushes the content of the buffer when using pino.destination({ sync: false }).
   * call the callback when finished
   */
  flush(cb?: (err?: Error) => void): void;
}

/**
 * The global options of the logger.
 */
export type LoggerGlobalOptions = Pick<
  pino.LoggerOptions,
  | 'level'
  | 'transport'
  | 'customLevels'
  | 'crlf'
  | 'hooks'
  | 'formatters'
  | 'depthLimit'
  | 'edgeLimit'
  | 'enabled'
  | 'msgPrefix'
  | 'serializers'
  | 'safe'
  | 'timestamp'
>;

export interface LoggerOptions {
  /**
   * The level of the logger.
   *
   * @default info
   */
  level?: LogLevel;

  /**
   * The default attributes that will be included in log message.
   *
   * Those attributes will be merged with the attributes defined by global options.
   */
  attributes?: LogAttributes;

  /**
   * A string that would be prefixed to every message (and child message)
   */
  msgPrefix?: string;
}

/**
 * Customize the default options of the logger.
 */
export type setOptions = (options: LoggerGlobalOptions) => void;

/**
 * Get or create a new logger instance
 */
export type getLogger = (name: string, options?: LoggerOptions) => Logger;
// }
