const { validationResult } = require("express-validator");

const validate = (validations) => {
  return async (req, res, next) => {
    // On exécute toutes les validations sans s'arrêter
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    return res.status(422).json({
      errors: errors.array(),
    });
  };
};

module.exports = validate;