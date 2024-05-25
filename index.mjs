import build from "pino-abstract-transport";
import { setOptions, getLogger } from "./src/logger.mjs";

export default {
  setOptions,
  getLogger,
  buildTransport: build,
}
