import { describe, it } from 'node:test'
import { once, sink } from './helper.mjs'
import { getLogger, setOptions } from '../src/logger.js'
import assert from 'node:assert'

describe('log by level', () => {
  const levels = ['info', 'warn', 'error', 'debug']

  for (const level of levels) {
    it(`should log ${level}`, async () => {
      const stream = sink()

      setOptions({
        transport: stream
      })
      const logger = getLogger('test')
      logger.info('test')

      const data = await once(stream, 'data')

      assert.strictEqual(data.message, 'test')
    })
  }
})
