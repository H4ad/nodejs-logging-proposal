'use strict'

/* eslint no-prototype-builtins: 0 */

const SonicBoom = require('sonic-boom')
const onExit = require('on-exit-leak-free')
const {
  lsCacheSym,
  chindingsSym,
  writeSym,
  formatOptsSym,
  endSym,
  stringifySym,
  nestedKeySym,
  formattersSym,
  nestedKeyStrSym,
  msgPrefixSym
} = require('./symbols')
const { isMainThread } = require('worker_threads')
const transport = require('./transport')
const { formatWithOptions } = require('node:util')

function noop() {
}

function genLog(level) {
  return LOG

  function LOG(o, ...n) {
    if (typeof o === 'object') {
      let msg = o
      // TODO(h4ad): add back the serializers for http req and res
      let formatParams
      if (msg === null && n.length === 0) {
        formatParams = [null]
      } else {
        msg = n.shift()
        formatParams = n
      }
      // We do not use a coercive check for `msg` as it is
      // measurably slower than the explicit checks.
      if (typeof this[msgPrefixSym] === 'string' && msg !== undefined && msg !== null) {
        msg = this[msgPrefixSym] + msg
      }
      this[writeSym](o, formatWithOptions(this[formatOptsSym], msg, ...formatParams), level)
    } else {
      let msg = o === undefined ? n.shift() : o

      // We do not use a coercive check for `msg` as it is
      // measurably slower than the explicit checks.
      if (typeof this[msgPrefixSym] === 'string' && msg !== undefined && msg !== null) {
        msg = this[msgPrefixSym] + msg
      }
      this[writeSym](null, formatWithOptions(this[formatOptsSym], msg, ...n), level)
    }
  }
}

function asString(str) {
  // TODO(h4ad): Should we get back the extreme performance of the old version?
  return JSON.stringify(str)
}

function asJson(obj, msg, num, time) {
  const stringify = this[stringifySym]
  const end = this[endSym]
  const chindings = this[chindingsSym]
  const formatters = this[formattersSym]
  const messageKey = 'message'
  let data = this[lsCacheSym][num] + time

  // we need the child bindings added to the output first so instance logged
  // objects can take precedence when JSON.parse-ing the resulting log line
  data = data + chindings

  let value
  if (formatters.log) {
    obj = formatters.log(obj)
  }

  let propStr = ''

  for (const key in obj) {
    value = obj[key]
    if (Object.prototype.hasOwnProperty.call(obj, key) && value !== undefined) {
      switch (typeof value) {
        case 'undefined':
        case 'function':
          continue
        case 'number':
          /* eslint no-fallthrough: "off" */
          if (Number.isFinite(value) === false) {
            value = null
          }
        // this case explicitly falls through to the next one
        case 'boolean':
          break
        case 'string':
          value = asString(value)
          break
        default:
          value = stringify(value)
      }
      if (value === undefined) continue
      const strKey = asString(key)
      propStr += ',' + strKey + ':' + value
    }
  }

  let msgStr = ''
  if (msg !== undefined) {
    value = msg

    switch (typeof value) {
      case 'function':
        break
      case 'number':
        if (Number.isFinite(value) === false) {
          value = null
        }
      // this case explicitly falls through to the next one
      case 'boolean':
        msgStr = ',"' + messageKey + '":' + value
        break
      case 'string':
        value = asString(value)
        msgStr = ',"' + messageKey + '":' + value
        break
      default:
        value = stringify(value)
        msgStr = ',"' + messageKey + '":' + value
    }
  }

  if (this[nestedKeySym] && propStr) {
    // place all the obj properties under the specified key
    // the nested key is already formatted from the constructor
    return data + this[nestedKeyStrSym] + propStr.slice(1) + '}' + msgStr + end
  } else {
    return data + propStr + msgStr + end
  }
}

function asChindings(instance, bindings) {
  let value
  let data = instance[chindingsSym]
  const stringify = instance[stringifySym]
  const formatter = instance[formattersSym].bindings
  bindings = formatter(bindings)

  for (const key in bindings) {
    value = bindings[key]
    const valid = key !== 'level' &&
      key !== 'serializers' &&
      key !== 'formatters' &&
      bindings.hasOwnProperty(key) &&
      value !== undefined
    if (valid === true) {
      value = stringify(value)
      if (value === undefined) continue
      data += ',"' + key + '":' + value
    }
  }
  return data
}

function hasBeenTampered(stream) {
  return stream.write !== stream.constructor.prototype.write
}

const hasNodeCodeCoverage = process.env.NODE_V8_COVERAGE || process.env.V8_COVERAGE

function buildSafeSonicBoom(opts) {
  const stream = new SonicBoom(opts)
  stream.on('error', filterBrokenPipe)
  // If we are sync: false, we must flush on exit
  // We must disable this if there is node code coverage due to
  // https://github.com/nodejs/node/issues/49344#issuecomment-1741776308.
  if (!hasNodeCodeCoverage && !opts.sync && isMainThread) {
    onExit.register(stream, autoEnd)

    stream.on('close', function () {
      onExit.unregister(stream)
    })
  }
  return stream

  function filterBrokenPipe(err) {
    // Impossible to replicate across all operating systems
    /* istanbul ignore next */
    if (err.code === 'EPIPE') {
      // If we get EPIPE, we should stop logging here
      // however we have no control to the consumer of
      // SonicBoom, so we just overwrite the write method
      stream.write = noop
      stream.end = noop
      stream.flushSync = noop
      stream.destroy = noop
      return
    }
    stream.removeListener('error', filterBrokenPipe)
    stream.emit('error', err)
  }
}

function autoEnd(stream, eventName) {
  // This check is needed only on some platforms
  /* istanbul ignore next */
  if (stream.destroyed) {
    return
  }

  if (eventName === 'beforeExit') {
    // We still have an event loop, let's use it
    stream.flush()
    stream.on('drain', function () {
      stream.end()
    })
  } else {
    // For some reason istanbul is not detecting this, but it's there
    /* istanbul ignore next */
    // We do not have an event loop, so flush synchronously
    stream.flushSync()
  }
}

function createArgsNormalizer(defaultOptions) {
  return function normalizeArgs(instance, caller, opts = {}, stream) {
    // support stream as a string
    if (typeof opts === 'string') {
      stream = buildSafeSonicBoom({ dest: opts })
      opts = {}
    } else if (typeof stream === 'string') {
      if (opts && opts.transport) {
        throw Error('only one of option.transport or stream can be specified')
      }
      stream = buildSafeSonicBoom({ dest: stream })
    } else if (opts instanceof SonicBoom || opts.writable || opts._writableState) {
      stream = opts
      opts = {}
    } else if (opts.transport) {
      if (opts.transport instanceof SonicBoom || opts.transport.writable || opts.transport._writableState) {
        stream = opts.transport
        delete opts.transport
      } else {
        if (opts.transport.targets && opts.transport.targets.length && opts.formatters && typeof opts.formatters.level === 'function') {
          throw Error('option.transport.targets do not allow custom level formatters')
        }

        stream = transport({ caller, ...opts.transport })
      }
    }

    if (opts.stringify && typeof opts.stringify !== 'function') {
      throw new Error('The "stringify" option must be a function')
    }

    opts = Object.assign({}, defaultOptions, opts)
    opts.serializers = Object.assign({}, defaultOptions.serializers, opts.serializers)
    opts.formatters = Object.assign({}, defaultOptions.formatters, opts.formatters)

    const { enabled } = opts
    if (enabled === false) opts.level = 'silent'
    if (!stream) {
      if (!hasBeenTampered(process.stdout)) {
        // If process.stdout.fd is undefined, it means that we are running
        // in a worker thread. Let's assume we are logging to file descriptor 1.
        stream = buildSafeSonicBoom({ fd: process.stdout.fd || 1 })
      } else {
        stream = process.stdout
      }
    }
    return { opts, stream }
  }
}

function stringify(obj) {
  try {
    return JSON.stringify(obj)
  } catch (_) {
    return '"[unable to serialize, probably a circular reference]"'
  }
}

function buildFormatters(level, bindings, log) {
  return {
    level,
    bindings,
    log
  }
}

module.exports = {
  noop,
  asChindings,
  asJson,
  genLog,
  createArgsNormalizer,
  stringify,
  buildFormatters,
}
