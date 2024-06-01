export interface LoggerFunction {
  <T extends object>(obj: T, msg?: string, ...args: any[]): void;
  (obj: unknown, msg?: string, ...args: any[]): void;
  (msg: string, ...args: any[]): void;
}

/**
 * This follows the syslog levels, specifically RFC5424.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc5424#section-6.2.1
 */
export type Level = "silent" | "emergency" | "alert" | "error" | "warning" | "notice" | "info" | "debug";

// declare module 'logging' {
export interface Logger {
  /**
   * Set the level of the logger.
   */
  setLevel(level: Level): this;

  /**
   * Get the current level of the logger.
   */
  getLevel(): Level;

  /**
   * Log at `'emergency'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  emergency: LoggerFunction;

  /**
   * Log at `'alert'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  alert: LoggerFunction;

  /**
   * Log at `'error'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  error: LoggerFunction;

  /**
   * Log at `'warning'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  warning: LoggerFunction;

  /**
   * Log at `'notice'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  notice: LoggerFunction;

  /**
   * Log at `'info'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  info: LoggerFunction;

  /**
   * Log at `'debug'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  debug: LoggerFunction;

  /**
   * Noop function.
   */
  silent: LoggerFunction;

  /**
   * Flushes the content of the buffer when using pino.destination({ sync: false }).
   * call the callback when finished
   */
  flush(cb?: (err?: Error) => void): void;
}

export interface LoggerTransportTargetOptions<TransportOptions = Record<string, any>> {
  target: string;
  options?: TransportOptions;
  level?: Level;
}

export interface LoggerTransportBaseOptions<TransportOptions = Record<string, any>> {
  options?: TransportOptions;
  worker?: WorkerOptions & { autoEnd?: boolean };
}

export interface LoggerTransportSingleOptions<TransportOptions = Record<string, any>>
  extends LoggerTransportBaseOptions<TransportOptions> {
  target: string;
}

export interface LoggerTransportPipelineOptions<TransportOptions = Record<string, any>>
  extends LoggerTransportBaseOptions<TransportOptions> {
  pipeline: LoggerTransportSingleOptions<TransportOptions>[];
  level?: Level;
}

export interface LoggerTransportMultiOptions<TransportOptions = Record<string, any>>
  extends LoggerTransportBaseOptions<TransportOptions> {
  targets: readonly (
    | LoggerTransportTargetOptions<TransportOptions>
    | LoggerTransportPipelineOptions<TransportOptions>
  )[];
  levels?: Record<string, number>;
  dedupe?: boolean;
}

/**
 * The global options of the logger.
 */
export type LoggerGlobalOptions = {
  /**
   * The name of the logger.
   *
   * @default undefined
   */
  name?: string;

  /**
   * One of the supported levels.
   *
   * @default info
   */
  level?: Level;

  /**
   * Enables or disables the inclusion of a timestamp in the log message. If a function is supplied, it must
   * synchronously return a JSON string representation of the time. If set to `false`, no timestamp will be included in the output.
   * See stdTimeFunctions for a set of available functions for passing in as a value for this option.
   * Caution: any sort of formatted time will significantly slow down Pino's performance.
   *
   * @default undefined
   */
  timestamp?: (() => string) | boolean;

  /**
   * An object containing functions for formatting the shape of the log lines.
   * These functions should return a JSONifiable object and should never throw.
   * These functions allow for full customization of the resulting log lines.
   * For example, they can be used to change the level key name or to enrich the default metadata.
   */
  formatters?: {
    /**
     * Changes the shape of the log level.
     * The default shape is { level: number }.
     * The function takes two arguments, the label of the level (e.g. 'info') and the numeric value (e.g. 30).
     */
    level?: (label: string, number: number) => object;
    /**
     * Changes the shape of the bindings.
     * The default shape is { pid, hostname }.
     * The function takes a single argument, the bindings object.
     * It will be called every time a child logger is created.
     */
    bindings?: (bindings: Bindings) => object;
    /**
     * Changes the shape of the log object.
     * This function will be called every time one of the log methods (such as .info) is called.
     * All arguments passed to the log method, except the message, will be pass to this function.
     * By default it does not change the shape of the log object.
     */
    log?: (object: Record<string, unknown>) => Record<string, unknown>;
  };

  /**
   * How the logger will handle the log messages.
   */
  transport?: LoggerTransportSingleOptions | LoggerTransportMultiOptions | LoggerTransportPipelineOptions | WritableStream;

  /**
   * A string that would be prefixed to every message (and child message)
   */
  msgPrefix?: string;

  /**
   * logs newline delimited JSON with `\r\n` instead of `\n`. Default: `false`.
   */
  crlf?: boolean;

  /**
   * key-value attributes object added as child logger to each log line. If set to null the base child logger is not added.
   *
   * @default { pid: process.pid, hostname: os.hostname()}
   */
  base?: { [key: string]: any } | null;

  /**
   * The string key to place any logged object under.
   */
  nestedKey?: string;

  /**
   * Enables logging.
   *
   * @default true
   */
  enabled?: boolean;
};

export interface LoggerOptions {
  /**
   * The level of the logger.
   *
   * @default info
   */
  level?: LogLevel;

  /**
   * The default base attributes that will be included in log message.
   *
   * Those values will be merged with the base attributes defined by global options.
   */
  base?: Record<PropertyKey, any>;

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
