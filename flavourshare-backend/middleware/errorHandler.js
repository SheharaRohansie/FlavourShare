const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (err && err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : null;
    const message = field === 'name'
      ? 'You already have a category with this name.'
      : 'Duplicate value error';
    return res.status(400).json({ message });
  }

  const statusCode = err.status || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  res.status(statusCode);
  res.json({
    message: err.message || 'Server error'
  });
};

module.exports = { notFound, errorHandler };
