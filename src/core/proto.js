'use strict'

/* eslint no-prototype-builtins: 0 */

const { EventEmitter } = require('events')
const {
  lsCacheSym,
  levelValSym,
  setLevelSym,
  getLevelSym,
  chindingsSym,
  parsedChindingsSym,
  asJsonSym,
  writeSym,
  timeSym,
  timeSliceIndexSym,
  streamSym,
  formattersSym,
  needsMetadataGsym,
  msgPrefixSym
} = require('./symbols')
const {
  getLevel,
  setLevel,
  isLevelEnabled,
  initialLsCache,
} = require('./levels')
const {
  asChindings,
  asJson,
  buildFormatters,
} = require('./tools')

// note: use of class is satirical
// https://github.com/pinojs/pino/pull/433#pullrequestreview-127703127
const constructor = class Pino {
}
const prototype = {
  constructor,
  child,
  bindings,
  setBindings,
  flush,
  isLevelEnabled,
  get level() {
    return this[getLevelSym]()
  },
  set level(lvl) {
    this[setLevelSym](lvl)
  },
  get levelVal() {
    return this[levelValSym]
  },
  set levelVal(n) {
    throw Error('levelVal is read-only')
  },
  [lsCacheSym]: initialLsCache,
  [writeSym]: write,
  [asJsonSym]: asJson,
  [getLevelSym]: getLevel,
  [setLevelSym]: setLevel
}

Object.setPrototypeOf(prototype, EventEmitter.prototype)

// exporting and consuming the prototype object using factory pattern fixes scoping issues with getters when serializing
module.exports = function() {
  return Object.create(prototype)
}

const resetChildingsFormatter = bindings => bindings

function child(bindings, options) {
  if (!bindings) {
    throw Error('missing bindings for child Pino')
  }
  options = options || {} // default options to empty object
  const formatters = this[formattersSym]
  const instance = Object.create(this)

  if (options.hasOwnProperty('formatters')) {
    const { level, bindings: chindings, log } = options.formatters
    instance[formattersSym] = buildFormatters(
      level || formatters.level,
      chindings || resetChildingsFormatter,
      log || formatters.log
    )
  } else {
    instance[formattersSym] = buildFormatters(
      formatters.level,
      resetChildingsFormatter,
      formatters.log
    )
  }

  if (typeof options.msgPrefix === 'string') {
    instance[msgPrefixSym] = (this[msgPrefixSym] || '') + options.msgPrefix
  }

  instance[chindingsSym] = asChindings(instance, bindings)
  const childLevel = options.level || this.level
  instance[setLevelSym](childLevel)
  return instance
}

function bindings() {
  const chindings = this[chindingsSym]
  const chindingsJson = `{${chindings.substr(1)}}` // at least contains ,"pid":7068,"hostname":"myMac"
  const bindingsFromJson = JSON.parse(chindingsJson)
  delete bindingsFromJson.pid
  delete bindingsFromJson.hostname
  return bindingsFromJson
}

function setBindings(newBindings) {
  const chindings = asChindings(this, newBindings)
  this[chindingsSym] = chindings
  delete this[parsedChindingsSym]
}

function write(_obj, msg, num) {
  const t = this[timeSym]()
  const messageKey = 'message'
  let obj

  if (_obj === undefined || _obj === null) {
    obj = {}
  } else if (_obj instanceof Error) {
    obj = { error: _obj }
    if (msg === undefined) {
      msg = _obj.message
    }
  } else {
    obj = _obj
    if (msg === undefined && _obj[messageKey] === undefined && _obj.error) {
      msg = _obj.error.message
    }
  }

  const s = this[asJsonSym](obj, msg, num, t)

  const stream = this[streamSym]
  if (stream[needsMetadataGsym] === true) {
    stream.lastLevel = num
    stream.lastObj = obj
    stream.lastMsg = msg
    stream.lastTime = t.slice(this[timeSliceIndexSym])
    stream.lastLogger = this // for child loggers
  }
  stream.write(s)
}

function noop() {
}

function flush(cb) {
  if (cb != null && typeof cb !== 'function') {
    throw Error('callback must be a function')
  }

  const stream = this[streamSym]

  if (typeof stream.flush === 'function') {
    stream.flush(cb || noop)
  } else if (cb) cb()
}
