import winston from 'winston';
import { Config } from './index';
const ColorizeOptions = {
    all: true,
    colors: {
        info: 'blue',
        error: 'red',
        warn: 'yellow',
        debug: 'magenta',
    },
};
const logger = winston.createLogger({
    level: 'info',
    defaultMeta: {
        serviceName: 'auth-service',
    },
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports: [
        new winston.transports.File({
            dirname: 'logs',
            filename: 'combined.log',
            level: 'info',
            silent: Config.NODE_ENV === 'test',
        }),
        new winston.transports.File({
            dirname: 'logs',
            filename: 'debug.log',
            level: 'debug',
            silent: Config.NODE_ENV === 'test',
        }),
        new winston.transports.File({
            dirname: 'logs',
            filename: 'error.log',
            level: 'error',
            silent: Config.NODE_ENV === 'test',
        }),
        new winston.transports.Console({
            level: 'info',
            silent: Config.NODE_ENV === 'test',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
                winston.format.colorize(ColorizeOptions),
            ),
        }),
        new winston.transports.Console({
            level: 'debug',
            silent: Config.NODE_ENV === 'test',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
                winston.format.colorize(ColorizeOptions),
            ),
        }),
        new winston.transports.Console({
            level: 'error',
            silent: Config.NODE_ENV === 'test',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
                winston.format.colorize(ColorizeOptions),
            ),
        }),
    ],
});

export default logger;
