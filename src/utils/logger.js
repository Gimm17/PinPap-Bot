// src/utils/logger.js
// Logging utility untuk PAP Bot

import fs from 'fs';
import path from 'path';

/**
 * Logger class with file and console output
 */
class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.logFile = options.logFile || './logs/bot.log';
    this.console = options.console !== false;

    // Log levels
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };

    // Ensure log directory exists
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Create write stream
    this.fileStream = fs.createWriteStream(this.logFile, { flags: 'a' });

    // Handle errors
    this.fileStream.on('error', (err) => {
      console.error(`[logger] File stream error:`, err);
    });
  }

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @returns {string} Formatted message
   */
  format(level, category, message, data = null) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;

    if (data) {
      try {
        return `${formatted}\n${JSON.stringify(data, null, 2)}`;
      } catch {
        return `${formatted}\n[Data serialization error]`;
      }
    }

    return formatted;
  }

  /**
   * Write to log
   * @param {string} level - Log level
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  log(level, category, message, data = null) {
    // Check level
    if (this.levels[level] > this.levels[this.level]) {
      return;
    }

    const formatted = this.format(level, category, message, data);

    // Write to file
    if (this.fileStream && this.fileStream.writable) {
      this.fileStream.write(formatted + '\n');
    }

    // Write to console
    if (this.console) {
      const colors = {
        error: '\x1b[31m', // Red
        warn: '\x1b[33m',  // Yellow
        info: '\x1b[36m',  // Cyan
        debug: '\x1b[90m', // Gray
      };
      const reset = '\x1b[0m';

      const color = colors[level] || reset;
      console.log(`${color}${formatted}${reset}`);
    }
  }

  /**
   * Error log
   */
  error(category, message, data = null) {
    this.log('error', category, message, data);
  }

  /**
   * Warning log
   */
  warn(category, message, data = null) {
    this.log('warn', category, message, data);
  }

  /**
   * Info log
   */
  info(category, message, data = null) {
    this.log('info', category, message, data);
  }

  /**
   * Debug log
   */
  debug(category, message, data = null) {
    this.log('debug', category, message, data);
  }

  /**
   * Command log
   */
  command(userId, command, guildId = null) {
    this.info('command', `/${command}`, {
      user: userId,
      guild: guildId || 'DM',
      timestamp: Date.now()
    });
  }

  /**
   * Interaction log
   */
  interaction(userId, type, customId) {
    this.debug('interaction', `${type}: ${customId}`, {
      user: userId,
      timestamp: Date.now()
    });
  }

  /**
   * Error with stack trace
   */
  stack(category, message, error) {
    this.error(category, message, {
      error: error.message,
      stack: error.stack,
      timestamp: Date.now()
    });
  }

  /**
   * Performance log
   */
  perf(operation, duration) {
    this.debug('perf', `${operation} took ${duration}ms`);
  }

  /**
   * Close logger
   */
  close() {
    if (this.fileStream) {
      this.fileStream.end();
    }
  }
}

/**
 * Global logger instance
 */
let logger = null;

/**
 * Initialize logger
 * @param {Object} options - Logger options
 */
export function initLogger(options = {}) {
  if (logger) {
    logger.close();
  }
  logger = new Logger(options);
  return logger;
}

/**
 * Get logger instance
 * @returns {Logger}
 */
export function getLogger() {
  if (!logger) {
    logger = new Logger();
  }
  return logger;
}

/**
 * Create category-specific logger
 * @param {string} category - Log category
 * @returns {Object} Logger with category bound
 */
export function createLogger(category) {
  const log = getLogger();

  return {
    error: (message, data) => log.error(category, message, data),
    warn: (message, data) => log.warn(category, message, data),
    info: (message, data) => log.info(category, message, data),
    debug: (message, data) => log.debug(category, message, data),
    stack: (message, error) => log.stack(category, message, error),
    perf: (operation, duration) => log.perf(operation, duration),
  };
}

// Export logger class
export { Logger };
export default getLogger;