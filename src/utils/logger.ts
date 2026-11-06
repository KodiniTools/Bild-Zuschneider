/* eslint-disable no-console */
/**
 * logger – zentrale Konsolenausgabe (Muster: Bildkonverter).
 *
 * log/info/debug erscheinen nur im Entwicklungsmodus (import.meta.env.DEV),
 * warn/error immer. Damit bleibt die Produktions-Konsole frei von Statusmeldungen.
 */
const isDev = import.meta.env.DEV;

type LogArgs = unknown[];

export const logger = {
  debug: (...args: LogArgs) => {
    if (isDev) console.debug(...args);
  },
  log: (...args: LogArgs) => {
    if (isDev) console.log(...args);
  },
  info: (...args: LogArgs) => {
    if (isDev) console.info(...args);
  },
  warn: (...args: LogArgs) => console.warn(...args),
  error: (...args: LogArgs) => console.error(...args),
};

export default logger;
