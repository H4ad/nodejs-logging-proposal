'use strict'
/* eslint no-prototype-builtins: 0 */
const {
  lsCacheSym,
  levelValSym,
  streamSym,
  formattersSym,
} = require('./symbols')
const { noop, genLog } = require('./tools')
const { DEFAULT_LEVELS, DEFAULT_LEVEL_NAMES } = require('./constants')

const levelMethods = {
  silent: noop,
  emergency: () => {
    const logFatal = genLog(DEFAULT_LEVELS.emergency)
    return function (...args) {
      const stream = this[streamSym]
      logFatal.call(this, ...args)
      if (typeof stream.flushSync === 'function') {
        try {
          stream.flushSync()
        } catch (e) {
          // https://github.com/pinojs/pino/pull/740#discussion_r346788313
        }
      }
    }
  },
  alert: () => genLog(DEFAULT_LEVELS.alert),
  critical: () => genLog(DEFAULT_LEVELS.critical),
  error: () => genLog(DEFAULT_LEVELS.error),
  warning: () => genLog(DEFAULT_LEVELS.warning),
  notice: () => genLog(DEFAULT_LEVELS.notice),
  info: () => genLog(DEFAULT_LEVELS.info),
  debug: () => genLog(DEFAULT_LEVELS.debug),
}

const nums = Object.keys(DEFAULT_LEVELS).reduce((o, k) => {
  o[DEFAULT_LEVELS[k]] = k
  return o
}, {})

const initialLsCache = Object.keys(nums).reduce((o, k) => {
  o[k] = '{"level":' + Number(k)
  return o
}, {})

function genLsCache(instance) {
  const formatter = instance[formattersSym].level
  const { labels } = instance.levels
  const cache = {}
  for (const label in labels) {
    const level = formatter(labels[label], Number(label))
    cache[label] = JSON.stringify(level).slice(0, -1)
  }
  instance[lsCacheSym] = cache
  return instance
}

function isStandardLevel(level) {
  return DEFAULT_LEVEL_NAMES.includes(level)
}

function levelComparison(level, configLevel) {
  return level <= configLevel
}

function setLevel(level) {
  const { labels, values } = this.levels
  if (typeof level === 'number') {
    if (labels[level] === undefined) throw Error('unknown level value' + level)
    level = labels[level]
  }
  if (values[level] === undefined) throw Error('unknown level ' + level)

  const preLevelVal = this[levelValSym]
  const levelVal = this[levelValSym] = values[level]

  for (const key in values) {
    if (levelComparison(values[key], levelVal) === false) {
      this[key] = noop
      continue
    }

    this[key] = levelMethods[key]()
  }
}

function getLevel(level) {
  const { levels, levelVal } = this
  // protection against potential loss of Pino scope from serializers (edge case with circular refs - https://github.com/pinojs/pino/issues/833)
  return (levels && levels.labels) ? levels.labels[levelVal] : ''
}

function isLevelEnabled(logLevel) {
  const { values } = this.levels
  const logLevelVal = values[logLevel]

  return logLevelVal !== undefined && levelComparison(logLevelVal, this[levelValSym])
}

function getLevelsConfig() {
  const labels = DEFAULT_LEVEL_NAMES.reduce((acc, levelName) => {
    acc[DEFAULT_LEVELS[levelName]] = levelName
    return acc
  }, {})

  const values = DEFAULT_LEVELS

  return { labels, values }
}

function assertDefaultLevelFound(defaultLevel) {
  if (isStandardLevel(defaultLevel))
    return

  throw Error(`unknown level ${defaultLevel}, possible levels are: ${DEFAULT_LEVEL_NAMES.join(', ')}`)
}

module.exports = {
  initialLsCache,
  genLsCache,
  levelMethods,
  getLevel,
  setLevel,
  isLevelEnabled,
  mappings: getLevelsConfig,
  assertDefaultLevelFound,
}
