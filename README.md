# Node.js Structured Logging Proposal

In this repository, you will find the "skeleton" of the proposal to introduce Structured Logging at Node.js.

This proposal is based on the [Pino](https://github.com/pinojs/pino) logger, which is a very fast logger for Node.js.

## References

- [Pino API Docs](https://github.com/pinojs/pino/blob/main/docs/api.md)
- [Matteo Collina: Multithreaded Logging with Pino](https://www.youtube.com/watch?v=vETUVN-KEgc)
- [Matteo Collina: let's talk about logging](https://www.youtube.com/watch?v=fILO3kegjfw)

## API

The API consists of the following methods:

### getLogger(name: string, options?: LoggerOptions): Logger

This method creates a new logger instance, calling this method twice with the same name will return the same instance.

The options for this method are the following:

- `name`: The name of this instance.
- `options.level`: The log level of this instance.
- `options.msgPrefix`: A string that would be prefixed to every message (and child message)
- `options.attributes`: The default attributes that will be included in the log message. Those attributes will be merged with the attributes defined by global options.

This method will return an instance of `Logger`, which consists of the following methods:

- `setLevel(level: string): void`: To change the current level of this instance.
- `getLevel(): string`: Returns the current level of this instance.
- `fatal(...args): void`: Log message as fatal.
- `error(...args): void`: Log message as error.
- `warn(...args): void`: Log message as warn.
- `info(...args): void`: Log message as info.
- `debug(...args): void`: Log message as debug.
- `trace(...args): void`: Log message as trace.
- `silent(...args): void`: Log message as silent.
- `flush(cb?: (err?: Error) => void): void`: Flushes the content of the buffer when using pino.destination({ sync: false }). call the callback when finished.

### setGlobalOptions(options: LoggerGlobalOptions): void

This method sets the global options for all loggers.

Every time you call `getLogger`, you are creating a child from the global logger, so the attributes defined in the global options will be included in every log message.

The options for this method are the following:

- `options.timestamp`: Enables or disables the inclusion of a timestamp in the log message.
- `options.level`: The default log level for all child loggers.
- `options.transport`: See more about transport [here](https://github.com/pinojs/pino/blob/main/docs/transports.md).
- `options.customLevels`: See more about custom levels [here](https://github.com/pinojs/pino/blob/main/docs/api.md#customlevels-object)
- `options.crlf`: Set to true to logs newline delimited JSON with \r\n instead of \n.
- `options.formatters`: See more about formatters [here](https://github.com/pinojs/pino/blob/main/docs/api.md#formatters-object)
- `options.enabled`: Set to false to disable logging.
- `options.msgPrefix`: The msgPrefix property allows you to specify a prefix for every message of the logger and its children.
- `options.safe`: Avoid errors caused by circular references in the object tree.

This method also can be configured with the following environment variables:

- `NODE_LOGGER_LEVEL`: The default log level for all child loggers.
- `NODE_LOGGER_ATTRIBUTES`: You can define multiple times using the format `<key>=<value>` and separate by a comma, eg: `NODE_LOGGER_ATTRIBUTES=machine=dev,protocol=http`.
- `NODE_LOGGER_FORMATTERS`: TODO.
- `NODE_LOGGER_TRANSPORTS`: TODO.

### buildTransport

This method allows you to create a new transport for `pino`, you can read more about it [here](https://github.com/pinojs/pino-abstract-transport).

In summary, creating a new transport will look like:

```js
import { buildTransport } from 'node:logging';

export default async function (opts) {
  return buildTransport(async function (source) {
    for await (let obj of source) {
      console.log(obj)
    }
  })
}
```
