// src/utils/logger.ts
// src/utils/logger.ts

/**
 * Enum for supported log levels (INFO, ERROR, DEBUG)
 */
export enum LogLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

/**
 * Main log function: prints timestamped, leveled logs to the console.
 * @param level LogLevel (INFO, ERROR, DEBUG)
 * @param message Main log message
 * @param args Additional arguments to log
 */
export function log(level: LogLevel, message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] [${level}] ${message}`, ...args);
}

/**
 * Info-level log helper
 */
export function info(message: string, ...args: any[]) {
  log(LogLevel.INFO, message, ...args);
}

/**
 * Error-level log helper
 */
export function error(message: string, ...args: any[]) {
  log(LogLevel.ERROR, message, ...args);
}

/**
 * Debug-level log helper
 */
export function debug(message: string, ...args: any[]) {
  log(LogLevel.DEBUG, message, ...args);
}
