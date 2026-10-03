import ApiError from "../utils/ApiError.js";

const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return next(new ApiError(400, "Validation failed", errors));
  }

  if (source === "query") {
    req.validatedQuery = result.data; // req.query is read-only in Express 5
  } else {
    req[source] = result.data;
  }
  next();
};

export default validate;