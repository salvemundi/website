/**
 * Environment detection utilities
 * Detects whether request comes from development or production environment
 */

/**
 * Detect environment from request origin/referer headers
 * @param {Object} req - Express request object
 * @returns {string} - 'development' or 'production'
 */
function getEnvironment(req) {
    const origin = req.headers.origin || req.headers.referer || '';

    // Check for localhost or local IP
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return 'development';
    }

    // Check for dev subdomain
    if (origin.includes('dev.salvemundi.nl')) {
        return 'development';
    }

    // Check for production or pre-production domain
    if (origin.includes('salvemundi.nl') || origin.includes('preprod.salvemundi.nl')) {
        return 'production';
    }

    // Default to production for safety (unknown sources)
    return 'production';
}

/**
 * Check if request is from development environment
 * @param {Object} req - Express request object
 * @returns {boolean}
 */
function isDevelopment(req) {
    return getEnvironment(req) === 'development';
}

/**
 * Check if request is from production environment
 * @param {Object} req - Express request object
 * @returns {boolean}
 */
function isProduction(req) {
    return getEnvironment(req) === 'production';
}

module.exports = {
    getEnvironment,
    isDevelopment,
    isProduction
};
