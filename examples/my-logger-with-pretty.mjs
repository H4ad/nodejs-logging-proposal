import { getLogger, setOptions } from '../index.mjs';

setOptions({
  transport: {
    target: 'pino-pretty',
  },
  attributes: {
    machine: 'potato'
  },
})

const logger = getLogger('my-app', {
  level: 'debug',
});

logger.info('Hello, world!');
logger.debug('Hello, debug!');
