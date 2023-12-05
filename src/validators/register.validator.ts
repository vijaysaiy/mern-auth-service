import { checkSchema } from 'express-validator';

export default checkSchema({
    email: {
        errorMessage: 'Email is required!',
        notEmpty: true,
        trim: true,
        isEmail: true,
    },
    firstName: {
        errorMessage: 'firstName is required',
        notEmpty: true,
        trim: true,
    },
    lastName: {
        errorMessage: 'lastName is required',
        notEmpty: true,
        trim: true,
    },
    password: {
        isLength: {
            options: { min: 8 },
            errorMessage: 'password should be atleast 8 char"s',
        },
        errorMessage: 'password is required',
        notEmpty: true,
        trim: true,
    },
});
