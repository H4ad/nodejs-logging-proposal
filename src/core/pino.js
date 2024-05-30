'use strict'
/* eslint no-prototype-builtins: 0 */
const os = require('os')
const caller = require('./caller')
const time = require('./time')
const proto = require('./proto')
const symbols = require('./symbols')
const { assertDefaultLevelFound, mappings, genLsCache, genLevelComparison, assertLevelComparison } = require('./levels')
const { DEFAULT_LEVELS, SORTING_ORDER } = require('./constants')
const {
  createArgsNormalizer,
  asChindings,
  buildFormatters,
  stringify: defaultStringify,
  noop
} = require('./tools')
const {
  chindingsSym,
  timeSym,
  timeSliceIndexSym,
  streamSym,
  stringifySym,
  setLevelSym,
  endSym,
  formatOptsSym,
  nestedKeySym,
  levelCompSym,
  useOnlyCustomLevelsSym,
  formattersSym,
  nestedKeyStrSym,
  msgPrefixSym
} = symbols
const { epochTime, nullTime } = time
const { pid } = process
const hostname = os.hostname()
const defaultOptions = {
  level: 'info',
  levelComparison: SORTING_ORDER.ASC,
  levels: DEFAULT_LEVELS,
  nestedKey: null,
  enabled: true,
  base: { pid, hostname },
  formatters: Object.assign(Object.create(null), {
    bindings(bindings) {
      return bindings
    },
    level(label, number) {
      return { level: number }
    }
  }),
  timestamp: epochTime,
  name: undefined,
  customLevels: null,
  useOnlyCustomLevels: false,
  stringify: defaultStringify,
}

const normalize = createArgsNormalizer(defaultOptions)

function pino(...args) {
  const instance = {}
  const { opts, stream } = normalize(instance, caller(), ...args)
  const {
    crlf,
    timestamp,
    nestedKey,
    base,
    name,
    level,
    customLevels,
    levelComparison,
    useOnlyCustomLevels,
    formatters,
    msgPrefix,
    stringify
  } = opts

  const allFormatters = buildFormatters(
    formatters.level,
    formatters.bindings,
    formatters.log
  )

  const end = '}' + (crlf ? '\r\n' : '\n')
  const coreChindings = asChindings.bind(null, {
    [chindingsSym]: '',
    [stringifySym]: stringify,
    [formattersSym]: allFormatters
  })

  let chindings = ''
  if (base !== null) {
    if (name === undefined) {
      chindings = coreChindings(base)
    } else {
      chindings = coreChindings(Object.assign({}, base, { name }))
    }
  }

  const time = (timestamp instanceof Function)
    ? timestamp
    : (timestamp ? epochTime : nullTime)
  const timeSliceIndex = time().indexOf(':') + 1

  if (useOnlyCustomLevels && !customLevels) throw Error('customLevels is required if useOnlyCustomLevels is set true')
  if (msgPrefix && typeof msgPrefix !== 'string') throw Error(`Unknown msgPrefix type "${typeof msgPrefix}" - expected "string"`)

  assertDefaultLevelFound(level, customLevels, useOnlyCustomLevels)
  const levels = mappings(customLevels, useOnlyCustomLevels)

  if (typeof stream.emit === 'function') {
    stream.emit('message', { code: 'PINO_CONFIG', config: { levels } })
  }

  assertLevelComparison(levelComparison)
  const levelCompFunc = genLevelComparison(levelComparison)

  Object.assign(instance, {
    levels,
    [levelCompSym]: levelCompFunc,
    [useOnlyCustomLevelsSym]: useOnlyCustomLevels,
    [streamSym]: stream,
    [timeSym]: time,
    [timeSliceIndexSym]: timeSliceIndex,
    [stringifySym]: stringify,
    [endSym]: end,
    [formatOptsSym]: {}, // TODO(h4ad): Remove or expose to the user
    [nestedKeySym]: nestedKey,
    // protect against injection
    [nestedKeyStrSym]: nestedKey ? `,${JSON.stringify(nestedKey)}:{` : '',
    [chindingsSym]: chindings,
    [formattersSym]: allFormatters,
    silent: noop,
    [msgPrefixSym]: msgPrefix
  })

  Object.setPrototypeOf(instance, proto())

  genLsCache(instance)

  instance[setLevelSym](level)

  return instance
}

module.exports = pino

module.exports.levels = mappings()

module.exports.symbols = symbols

// Enables default and name export with TypeScript and Babel
module.exports.default = pino
module.exports.pino = pino
