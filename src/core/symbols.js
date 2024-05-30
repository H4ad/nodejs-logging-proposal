'use strict'

const setLevelSym = Symbol('pino.setLevel')
const getLevelSym = Symbol('pino.getLevel')
const levelValSym = Symbol('pino.levelVal')
const levelCompSym = Symbol('pino.levelComp')
const useLevelLabelsSym = Symbol('pino.useLevelLabels')
const useOnlyCustomLevelsSym = Symbol('pino.useOnlyCustomLevels')

const lsCacheSym = Symbol('pino.lsCache')
const chindingsSym = Symbol('pino.chindings')

const asJsonSym = Symbol('pino.asJson')
const writeSym = Symbol('pino.write')

const timeSym = Symbol('pino.time')
const timeSliceIndexSym = Symbol('pino.timeSliceIndex')
const streamSym = Symbol('pino.stream')
const stringifySym = Symbol('pino.stringify')
const endSym = Symbol('pino.end')
const formatOptsSym = Symbol('pino.formatOpts')
const messageKeySym = Symbol('pino.messageKey')
const errorKeySym = Symbol('pino.errorKey')
const nestedKeySym = Symbol('pino.nestedKey')
const nestedKeyStrSym = Symbol('pino.nestedKeyStr')
const msgPrefixSym = Symbol('pino.msgPrefix')

// public symbols, no need to use the same pino
// version for these
const formattersSym = Symbol.for('pino.formatters')
const needsMetadataGsym = Symbol.for('pino.metadata')

module.exports = {
  setLevelSym,
  getLevelSym,
  levelValSym,
  levelCompSym,
  useLevelLabelsSym,
  lsCacheSym,
  chindingsSym,
  asJsonSym,
  writeSym,
  timeSym,
  timeSliceIndexSym,
  streamSym,
  stringifySym,
  endSym,
  formatOptsSym,
  messageKeySym,
  errorKeySym,
  nestedKeySym,
  needsMetadataGsym,
  useOnlyCustomLevelsSym,
  formattersSym,
  nestedKeyStrSym,
  msgPrefixSym
}
