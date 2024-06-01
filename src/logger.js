const { hostname } = require('os')
const pino = require('./core/pino')

/**
 * @typedef {{attributes?: object, level?: string, msgPrefix?: string }} LoggerOptions
 */

/**
 * @typedef {Pick<pino.LoggerOptions, 'level' | 'transport' | 'crlf' | 'formatters' | 'enabled' | 'msgPrefix' | 'name' | 'timestamp'> & { attributes?: object }} LoggerGlobalOptions
 */

const kInternalConstructor = Symbol('kInternalConstructor')
const kUpdatePinoGlobal = Symbol('kUpdatePinoGlobal')

/**
 * @returns {LoggerGlobalOptions}
 */
function buildDefaultOptionsFromEnvironment() {
  let base = { pid: process.pid, hostname: hostname() }

  if (process.env.NODE_LOGGER_ATTRIBUTES) {
    base = process.env.NODE_LOGGER_ATTRIBUTES.split(',').reduce((acc, curr) => {
      const [key, value] = curr.split('=')

      // TODO: Sanitize key to avoid security issues
      acc[key] = value

      return acc
    }, {})
  }

  const options = {}

  if (process.env.NODE_LOGGER_LEVEL) {
    options.level = process.env.NODE_LOGGER_LEVEL
  }

  if (base) {
    options.base = base
  }

  return options
}

let pinoInstance = undefined


// TODO: How to free those objects if the logger is not used anymore?
const pinoChildInstances = new Map()

/**
 * @param {LoggerGlobalOptions} options
 */
function setOptions(options) {
  if (typeof options !== 'object') {
    throw new TypeError('options must be an object')
  }

  options = Object.assign({}, buildDefaultOptionsFromEnvironment(), options)

  const validProperties = ['name', 'level', 'timestamp', 'formatters', 'transport', 'msgPrefix', 'crlf',  'base', 'nestedKey', 'enabled']

  for (const key of Object.keys(options)) {
    if (!validProperties.includes(key)) {
      delete options[key]
    }
  }

  pinoInstance = pino(options)

  for (const logger of pinoChildInstances.values()) {
    logger[kUpdatePinoGlobal]()
  }
}

/**
 * Initialize the logger with default options
 */
setOptions({})

class Logger {
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
      throw new TypeError('You cannot create a Logger instance directly')
    }

    if (typeof name !== 'string') {
      throw new TypeError('Logger name must be a string')
    }

    this.#name = name
    this.#options = options || {}

    this[kUpdatePinoGlobal]()
  }

  /**
   * Refreshes the pino instance when pino global is updated
   */
  [kUpdatePinoGlobal]() {
    this.#pinoChild = pinoInstance.child({
      ...this.#options.base,
      name: this.#name
    }, {
      level: this.#options.level,
      msgPrefix: this.#options.msgPrefix
    })

    this.emergency = this.#pinoChild.emergency.bind(this.#pinoChild)
    this.alert = this.#pinoChild.alert.bind(this.#pinoChild)
    this.critical = this.#pinoChild.critical.bind(this.#pinoChild)
    this.error = this.#pinoChild.error.bind(this.#pinoChild)
    this.warning = this.#pinoChild.warning.bind(this.#pinoChild)
    this.notice = this.#pinoChild.notice.bind(this.#pinoChild)
    this.info = this.#pinoChild.info.bind(this.#pinoChild)
    this.debug = this.#pinoChild.debug.bind(this.#pinoChild)
  }

  isEnabled() {
    return this.#pinoChild.isLevelEnabled(this.#pinoChild.level)
  }

  /**
   * @param {string} level
   */
  setLevel(level) {
    this.#pinoChild.level = level
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
    this.#pinoChild.flush(cb)
  }
}

/**
 * @param {string} name
 * @param {LoggerOptions | undefined} [options=undefined] options
 * @returns Logger
 */
function getLogger(name, options) {
  const alreadyExist = pinoChildInstances.get(name)

  if (alreadyExist !== undefined) {
    return alreadyExist
  }

  const logger = new Logger(kInternalConstructor, name, options)

  pinoChildInstances.set(name, logger)

  return logger
}

module.exports = {
  getLogger,
  setOptions
}
