import AuditLog from '../models/AuditLog.js';

/**
 * Middleware or helper to log actions
 * @param {string} action - Description of the action
 * @param {string} entityType - Type of entity (e.g., 'TICKET', 'USER')
 * @returns {Function} Express middleware
 */
export const logAction = (action, entityType) => {
    return async (req, res, next) => {
        // Capture original end function to log after response
        const originalEnd = res.end;

        res.end = async function (chunk, encoding) {
            // Restore original end
            res.end = originalEnd;
            res.end(chunk, encoding);

            // Access logs only if success or specialized logic
            if (res.statusCode >= 200 && res.statusCode < 400) {
                try {
                    if (req.user) {
                        await AuditLog.create({
                            userId: req.user.id,
                            action: action,
                            entityType: entityType,
                            entityId: req.params.id || req.body.id || null, // Best guess
                            details: {
                                method: req.method,
                                url: req.originalUrl,
                                body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : null,
                                query: req.query
                            },
                            ipAddress: req.ip
                        });
                    }
                } catch (error) {
                    console.error('Audit Log Error:', error);
                }
            }
        };
        next();
    };
};

/**
 * Manual logger function for usage inside controllers
 */
export const audit = async (userId, action, entityType, entityId, details = null) => {
    try {
        await AuditLog.create({
            userId,
            action,
            entityType,
            entityId,
            details,
        });
    } catch (error) {
        console.error('Manual Audit Error:', error);
    }
};
