const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch(err => {
            console.error(err); // Log the error for debugging purposes

            if (err.code && err.code === 11000) {
                // Handle MongoDB duplicate key error (E11000)
                const field = Object.keys(err.keyValue)[0]; // Get the field that caused the duplication
                return res.status(400).json({
                    message: `Duplicate value error: ${field} "${err.keyValue[field]}" already exists.`,
                    success: false
                });
            }

            return res.status(500).json({
                message: `Internal Server Error`,
                success: false
            });
        });
};

module.exports = asyncHandler;
