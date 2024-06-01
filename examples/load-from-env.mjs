// run with node --env-file ./load-from-env.env ./load-from-env.mjs

import { getLogger } from '../index.mjs';

const logger = getLogger('my-app');

logger.debug({ test: true}, 'Hello, world!', { batata: true });
