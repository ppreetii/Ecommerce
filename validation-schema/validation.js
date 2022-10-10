const Joi = require("joi");

const CONSTANTS = require("../constants/common");
const ERRORS = require("../constants/errors");

exports.ProductSchema = Joi.object().keys({
  title: Joi.string().min(CONSTANTS.TITLE_LENGTH_MIN).required(),
  price: Joi.number().required(),
  description: Joi.string()
    .min(CONSTANTS.DESCRIPTION_LENGTH_MIN)
    .max(CONSTANTS.DESCRIPTION_LENGTH_MAX)
    .required(),
  imageUrl: Joi.string().required()
});

exports.LoginSchema = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(CONSTANTS.PSWD_LENGTH_MIN).required()
});

exports.SignUpSchema = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(CONSTANTS.PSWD_LENGTH_MIN).required(),
    confirmPassword: Joi.any().equal(Joi.ref('password')).required()
    .messages({ 'any.only': ERRORS.PWSD_MISMATCH })
})