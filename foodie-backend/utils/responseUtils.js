// ===========================
// SEND SUCCESS RESPONSE
// ===========================
const sendSuccess = (res, statusCode, message, data = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

// ===========================
// SEND ERROR RESPONSE
// ===========================
const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};

// ===========================
// SEND PAGINATED RESPONSE
// ===========================
const sendPaginated = (res, statusCode, message, data, pagination) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        pagination: {
            ...pagination,
            currentPage: pagination.page,
            itemsPerPage: pagination.limit,
            totalItems: pagination.total,
            totalPages: pagination.pages,
            hasNextPage: pagination.page < pagination.pages,
            hasPrevPage: pagination.page > 1
        },
        timestamp: new Date().toISOString()
    });
};

// ===========================
// SEND CREATED RESPONSE
// ===========================
const sendCreated = (res, message, data = {}) => {
    return sendSuccess(res, 201, message, data);
};

// ===========================
// SEND NOT FOUND RESPONSE
// ===========================
const sendNotFound = (res, message = "Resource not found") => {
    return sendError(res, 404, message);
};

// ===========================
// SEND UNAUTHORIZED RESPONSE
// ===========================
const sendUnauthorized = (res, message = "Unauthorized access") => {
    return sendError(res, 401, message);
};

// ===========================
// SEND FORBIDDEN RESPONSE
// ===========================
const sendForbidden = (res, message = "Access forbidden") => {
    return sendError(res, 403, message);
};

// ===========================
// SEND VALIDATION ERROR
// ===========================
const sendValidationError = (res, errors) => {
    return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    sendSuccess,
    sendError,
    sendPaginated,
    sendCreated,
    sendNotFound,
    sendUnauthorized,
    sendForbidden,
    sendValidationError
};