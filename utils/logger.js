const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/default');

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const transports = [
    // Консоль всегда включена
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
                return `[${timestamp}] ${level}: ${message} ${metaString}`;
            })
        )
    })
];

// Добавляем файловые транспорты только если включено в конфиге
if (config.logging.logToFile) {
    transports.push(
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error',
            maxsize: config.logging.maxFileSize,
            maxFiles: config.logging.maxFiles
        }),
        new winston.transports.File({ 
            filename: path.join(logsDir, 'combined.log'),
            maxsize: config.logging.maxFileSize,
            maxFiles: config.logging.maxFiles
        })
    );
}

const logger = winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
        winston.format.timestamp({ format: config.logging.format }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'telemost-recorder' },
    transports: transports
});

module.exports = logger;