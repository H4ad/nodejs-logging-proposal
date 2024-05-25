import pino from 'pino';

/**
 * @typedef {{attributes?: object, level?: string, msgPrefix?: string }} LoggerOptions 
 */

/**
 * @typedef {Pick<pino.LoggerOptions, 'level' | 'transport' | 'customLevels' | 'crlf' | 'hooks' | 'formatters' | 'depthLimit' | 'edgeLimit' | 'enabled' | 'msgPrefix' | 'serializers' | 'safe' | 'name' | 'timestamp'> & { attributes?: object }} LoggerGlobalOptions
 */

const kInternalConstructor = Symbol('kInternalConstructor');
const kUpdatePinoGlobal = Symbol('kUpdatePinoGlobal');

/**
 * @returns {LoggerGlobalOptions}
 */
function buildDefaultOptionsFromEnvironment() {
  let attributes = undefined;

  if (process.env.NODE_LOGGER_ATTRIBUTES) {
    attributes = process.env.NODE_LOGGER_ATTRIBUTES.split(',').reduce((acc, curr) => {
      const [key, value] = curr.split('=');

      // TODO: Sanitize key to avoid security issues
      acc[key] = value;

      return acc;
    }, { });
  }

  return {
    level: process.env.NODE_LOGGER_LEVEL,
    attributes,
  }
}

let pinoInstance = undefined;;

// TODO: How to free those objects if the logger is not used anymore?
const pinoChildInstances = new Map();

/**
 * @param {LoggerGlobalOptions} options 
 */
export function setOptions(options) {
  if (typeof options !== 'object') {
    throw new TypeError('options must be an object');
  }

  options = Object.assign({}, buildDefaultOptionsFromEnvironment(), options);

  const attributes = options.attributes;
  const validProperties = ['level', 'transport', 'customLevels', 'crlf', 'hooks', 'formatters', 'depthLimit', 'edgeLimit', 'enabled', 'msgPrefix', 'serializers', 'safe', 'name', 'timestamp'];

  for (const key of Object.keys(options)) {
    if (!validProperties.includes(key)) {
      delete options[key];
    }
  }

  pinoInstance = pino({
    ...options,
    ...attributes && {
      mixin: () => attributes,
    },
  });

  for (const logger of pinoChildInstances) {
    logger[kUpdatePinoGlobal]();
  }
}

/**
 * Initialize the logger with default options
 */
setOptions({});

export class Logger {
  /**
   * @type {pino.Logger}
   */
  #pinoChild = undefined

  /**
   * @type {string}
   */
  #name = undefined

  /**
   * @type {LoggerOptions}
   */
  #options = undefined

  /**
   * @param {Symbol} internalConstructor 
   * @param {string} name
   * @param {LoggerOptions | undefined} options 
   */
  constructor(internalConstructor, name, options) {
    if (internalConstructor !== kInternalConstructor) {
      throw new TypeError('You cannot create a Logger instance directly');
    }

    if (typeof name !== 'string') {
      throw new TypeError('Logger name must be a string');
    }

    this.#name = name;
    this.#options = options || {};

    this[kUpdatePinoGlobal]();
  }

  /**
   * Refreshes the pino instance when pino global is updated
   */
  [kUpdatePinoGlobal]() {
    this.#pinoChild = pinoInstance.child({
      ...this.#options.attributes,
      name: this.#name,
    }, {
      level: this.#options.level,
      msgPrefix: this.#options.msgPrefix,
    });

    this.fatal = this.#pinoChild.fatal.bind(this.#pinoChild);
    this.error = this.#pinoChild.error.bind(this.#pinoChild);
    this.warn = this.#pinoChild.warn.bind(this.#pinoChild);
    this.info = this.#pinoChild.info.bind(this.#pinoChild);
    this.debug = this.#pinoChild.debug.bind(this.#pinoChild);
    this.trace = this.#pinoChild.trace.bind(this.#pinoChild);
    this.silent = this.#pinoChild.silent.bind(this.#pinoChild);
  }

  isEnabled() {
    return this.#pinoChild.isLevelEnabled(this.#pinoChild.level);
  }

  /**
   * @param {string} level 
   */
  setLevel(level) {
    this.#pinoChild.level = level;
  }

  /**
   * @returns {string}
   */
  getLevel() {
    return this.#pinoChild.level
  }


  /**
   * @param {(err?: Error) => void} cb
   */
  flush(cb) {
    this.#pinoChild.flush(cb);
  }
}

/**
 * @param {string} name
 * @param {LoggerOptions} options
 * @returns Logger
 */
export function getLogger(name, options) {
  const alreadyExist = pinoChildInstances.get(name);

  if (alreadyExist !== undefined) {
    return alreadyExist;
  }

  const logger = new Logger(kInternalConstructor, name, options);

  pinoChildInstances.set(logger);

  return logger;
}