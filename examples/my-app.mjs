import { getLogger, setOptions } from '../index.mjs';

setOptions({
  base: {
    potato: 'test'
  }
})

const logger = getLogger('my-app', {
  level: 'debug',
  base: {
    custom: 'test'
  }
});

logger.info('Hello, world!');
logger.debug('Hello, debug!');
