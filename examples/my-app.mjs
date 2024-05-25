import { getLogger } from '../index.mjs';

const logger = getLogger('my-app', {
  level: 'debug'
});

logger.info('Hello, world!');
logger.debug('Hello, debug!');
