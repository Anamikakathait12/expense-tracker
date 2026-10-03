import ApiError from "../utils/ApiError.js";

const validate = (schema) => (req,res,next) =>{
    const result = schema.safeParse(req.body);

    if(!result.success){
        const errors = result.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
        }));
        return next(new ApiError(400, "Validation failed", errors));
    }

    req.body = result.data; // cleaned data
    next();
};

export default validate;