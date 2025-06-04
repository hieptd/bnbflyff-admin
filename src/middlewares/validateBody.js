module.exports = function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      // Format errors as { fieldName: "message" }
      const errors = {};
      error.details.forEach((detail) => {
        const key = detail.path.join(".");
        if (!errors[key]) {
          errors[key] = detail.message;
        }
      });
      return res.status(400).json({ errors });
    }
    next();
  };
};
