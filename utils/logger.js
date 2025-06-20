import winston from 'winston';
import path from 'path';

const { createLogger: winstonCreateLogger, format, transports } = winston;
const { combine, timestamp, label, printf, colorize } = format;

// Custom log format
const logFormat = printf(({ level, message, label, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${label}] ${level}: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += `\nMetadata: ${JSON.stringify(metadata, null, 2)}`;
  }
  
  return msg;
});

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

export function createLogger(service) {
  return winstonCreateLogger({
    format: combine(
      label({ label: service }),
      timestamp(),
      colorize(),
      logFormat
    ),
    transports: [
      // Console transport for development
      new transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
      }),
      
      // File transport for errors
      new transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      
      // File transport for all logs
      new transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      
      // Service-specific logs
      new transports.File({
        filename: path.join(logsDir, `${service}.log`),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    ],
    exceptionHandlers: [
      new transports.File({
        filename: path.join(logsDir, 'exceptions.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    ],
    rejectionHandlers: [
      new transports.File({
        filename: path.join(logsDir, 'rejections.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    ],
    exitOnError: false
  });
}

// Error tracking integration (e.g., Sentry)
if (process.env.NODE_ENV === 'production') {
  const Sentry = require('@sentry/node');
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

// Export a default logger instance
export const logger = createLogger('app');

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  
  // Give time for logs to be written before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
}); 