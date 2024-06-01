/**
 * Represents default log level values
 *
 * @enum {number}
 */
const DEFAULT_LEVELS = {
  silent: -Infinity,
  emergency: 0,
  alert: 1,
  critical: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
}

const DEFAULT_LEVEL_NAMES = Object.keys(DEFAULT_LEVELS)

module.exports = {
  DEFAULT_LEVELS,
  DEFAULT_LEVEL_NAMES,
}
