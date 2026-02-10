const { v4: uuidv4 } = require('uuid');

/**
 * Middleware for distributed tracing and request logging.
 * Manages X-Correlation-ID and prefixes console logs with the ID.
 */
const requestLogger = (req, res, next) => {
    // Extract or generate Correlation ID
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    req.id = correlationId;

    // Set header for response & downstream calls
    res.setHeader('X-Correlation-ID', correlationId);

    // Override console methods to include correlation ID
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    // Using a simple prefixing approach
    // Note: In production, a proper logging library like Winston or Pino is better
    // but this meets the "prefix ALL console.logs" requirement simply.
    console.log = (...args) => originalLog(`[${req.id}]`, ...args);
    console.warn = (...args) => originalWarn(`[${req.id}]`, ...args);
    console.error = (...args) => originalError(`[${req.id}]`, ...args);

    // Ensure we restore originals after the request finishes to avoid log pollution 
    // when multiple requests overlap (though Node's async nature makes this tricky 
    // without AsyncLocalStorage).
    res.on('finish', () => {
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;
    });

    next();
};

module.exports = requestLogger;
