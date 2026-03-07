const { AppError } = require('./errorHandler');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return next(new AppError(`Validation error: ${errors.map(e => e.message).join(', ')}`, 400));
  }

  // Replace with parsed/coerced values
  req.body = result.data.body ?? req.body;
  req.query = result.data.query ?? req.query;
  req.params = result.data.params ?? req.params;
  next();
};

module.exports = validate;
