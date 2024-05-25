declare module 'logging' {
  export enum LogLevel {
    TRACE = 'trace',
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal',
  }

  /**
   * This list will always have odd length because the items will be composed by key=value.
   */
  export type LogAttributes = Record<string, any>;

  /**
   * The message that will be created to be passed to the formatters.
   *
   * This entire object is mutable.
   */
  export interface LogMessage {
    /**
     * The message from the logger
     */
    message: string;
    /**
     * The logger level from the logger
     */
    level: LogLevel;
    /**
     * The list of attributes of this log message.
     */
    attributes: LogAttributes;

    /**
     * The creation date of this log
     */
    timestamp: number;
  }

  export interface LoggerTransportOptions {
    [key: string]: any;
  }

  export interface LoggerFormatterOptions {
    [key: string]: any;
  }

  /**
   * The logger transport
   */
  export type LoggerTransport = {
    /**
     * The path for the js file of the transport
     */
    target: string;
    options: LoggerTransportOptions;
  };

  export interface LoggerTransportFileOptions {
    /**
     * The path of the file that will be stored the logs.
     *
     * This configuration can be changed via `LOGGER_TRANSPORT_FILE_PATH=<path>`.
     */
    path: string;
    /**
     * In case the folder of the path didn't exist, you can enable this to ensure the folder will exist.
     *
     * This configuration can be changed via `LOGGER_TRANSPORT_FILE_RECURSIVE=<true|false>`.
     *
     * @default {true}
     */
    recursive?: boolean;
    /**
     * Configure the permissions of the file.
     *
     * This configuration can be changed via `LOGGER_TRANSPORT_FILE_MODE=<0x000>`.
     *
     * @default {0x600}
     */
    mode?: number;
  }

  /**
   * The logger formatter
   */
  export type LoggerFormatter = {
    /**
     * The path for the js file of the formatter
     */
    target: string;
    options: LoggerFormatterOptions;
  };

  export interface LoggerFormatterSimpleOptions {
    /**
     * Enable or disable the colors.
     *
     * This configuration can be changed via `NODE_LOGGER_FORMATTER_SIMPLE_COLORS=<true|false>`.
     *
     * @default {false}
     */
    colors?: boolean;
  }

  export interface LoggerFormatterTemplateOptions {
    /**
     * 
     */
    template: string;
  }

  export interface Logger {
    setLevel(level: LogLevel): this;
    getLevel(): LogLevel;
    isEnabled(): boolean;

    log(level: LogLevel, message: string, ...attributes: any[]): void;

    getTransports(): LoggerTransport[];
    getFormatters(): LoggerFormatter[];

    addTransport(target: 'node:logging/transports/stdout'): this;
    addTransport(target: 'node:logging/transports/file', options: LoggerTransportFileOptions): this;
    addTransport(target: string, options?: Record<string, any>): this;

    removeTransport(target: string): this;
    removeAllTransports(): this;

    addFormatter(target: 'node:logging/formatters/simple', options?: LoggerFormatterSimpleOptions): this;
    addFormatter(target: 'node:logging/formatters/json'): this;
    addFormatter(target: 'node:logging/formatters/template'): this;
    addFormatter(target: string, options?: Record<string, any>): this;
    removeFormatter(target: string): this;
    removeAllFormatters(): this;

    addAttribute(key: string, value: any): this;
    removeAttribute(key: string): this;
    removeAllAttributes(): this;

    info(message: string, ...attributes: any[]): void;
    warn(message: string, ...attributes: any[]): void;
    debug(message: string, ...attributes: any[]): void;
    error(message: string, ...attributes: any[]): void;
    warn(message: string, ...attributes: any[]): void;
    trace(message: string, ...attributes: any[]): void;

    /**
     * Wait all the logs to be flushed
     */
    flushSync(): void;
  }

  export interface LoggerOptions {
    /**
     * The transporter options
     */
    transportOptions?: LoggerTransportOptions;

    /**
     * The formatter options
     */
    formatterOptions?: LoggerFormatterOptions;

    /**
     * The default attributes that will be included in log message.
     *
     * If the logger instance already exist, the attributes will be included in that instance.
     */
    attributes?: LogAttributes;
  }

  /**
   * Get or create a new logger instance
   */
  export type getLogger = (name: string, options?: LoggerOptions) => Logger;
}
