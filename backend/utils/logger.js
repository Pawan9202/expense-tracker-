const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (stack) msg += '\n' + stack;
    if (Object.keys(metadata).length > 0) msg += ` ${JSON.stringify(metadata)}`;
    return msg;
  })
);

const transports = [
  new winston.transports.Console({
    format: config.env === 'production' ? logFormat : consoleFormat,
  }),
];

if (config.env === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports,
  exitOnError: false,
});

module.exports = logger;