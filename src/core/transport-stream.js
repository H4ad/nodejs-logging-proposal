'use strict'

module.exports = loadTransportStreamBuilder

/**
 * Loads & returns a function to build transport streams
 * @param {string} target
 * @returns {function(object): Promise<import('stream').Writable>}
 * @throws {Error} In case the target module does not export a function
 */
async function loadTransportStreamBuilder(target) {
  let fn
  try {
    const toLoad = target.startsWith('file://') ? target : 'file://' + target

    fn = (await import(toLoad))
  } catch (error) {
    // See this PR for details: https://github.com/pinojs/thread-stream/pull/34
    if ((error.code === 'ENOTDIR' || error.code === 'ERR_MODULE_NOT_FOUND')) {
      fn = require(target)
    } else if (error.code === undefined) {
      // When bundled with pkg, an undefined error is thrown when called with realImport
      fn = require(decodeURIComponent(target))
    } else {
      throw error
    }
  }

  // Depending on how the default export is performed, and on how the code is
  // transpiled, we may find cases of two nested "default" objects.
  // See https://github.com/pinojs/pino/issues/1243#issuecomment-982774762
  if (typeof fn === 'object') fn = fn.default
  if (typeof fn === 'object') fn = fn.default
  if (typeof fn !== 'function') throw Error('exported worker is not a function')

  return fn
}
