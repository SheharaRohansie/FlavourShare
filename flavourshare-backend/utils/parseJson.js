const parseJsonField = (value, fallback, fieldName) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    const err = new Error(`${fieldName} must be valid JSON`);
    err.status = 400;
    throw err;
  }
};

module.exports = { parseJsonField };
