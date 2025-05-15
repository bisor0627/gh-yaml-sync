const winston = require("winston");

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.printf(({ level, message }) => {
        const levelIcon = {
            info: "ℹ️",
            warn: "⚠️",
            error: "❌",
            debug: "🐛",
        }[level] || "";
        return `${levelIcon} [${level.toUpperCase()}] ${message}`;
    }),
    transports: [new winston.transports.Console()],
});

module.exports = {
    info: (msg) => logger.info(msg),
    warn: (msg) => logger.warn(msg),
    error: (msg) => logger.error(msg),
    debug: (msg) => logger.debug(msg),
    logger, // 확장성을 위해 원본도 export
};
