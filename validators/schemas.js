const Joi = require('joi');

// Validación de registro
const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .trim()
    .messages({
      'string.empty': 'El nombre es requerido',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres'
    }),
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .messages({
      'string.email': 'Correo inválido',
      'string.empty': 'El correo es requerido'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'string.empty': 'La contraseña es requerida'
    })
});

// Validación de login
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .messages({
      'string.email': 'Correo inválido',
      'string.empty': 'El correo es requerido'
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'La contraseña es requerida'
    })
});

// Validación de amortización
const amortizacionSchema = Joi.object({
  nombre: Joi.string()
    .max(200)
    .trim()
    .messages({
      'string.max': 'El nombre no puede exceder 200 caracteres'
    }),
  monto: Joi.number()
    .positive()
    .max(1000000000)
    .required()
    .messages({
      'number.positive': 'El monto debe ser positivo',
      'number.max': 'El monto es demasiado alto',
      'any.required': 'El monto es requerido'
    }),
  tasaAnual: Joi.number()
    .min(0)
    .max(100)
    .required()
    .messages({
      'number.min': 'La tasa debe ser no negativa',
      'number.max': 'La tasa no puede exceder 100%',
      'any.required': 'La tasa anual es requerida'
    }),
  plazoAnios: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .required()
    .messages({
      'number.integer': 'El plazo debe ser un número entero',
      'number.min': 'El plazo debe ser al menos 1 año',
      'number.max': 'El plazo no puede exceder 100 años',
      'any.required': 'El plazo es requerido'
    }),
  pagosAno: Joi.number()
    .integer()
    .valid(1, 2, 4, 12, 24, 26, 52)
    .required()
    .messages({
      'any.only': 'Frecuencia de pago inválida',
      'any.required': 'La frecuencia de pago es requerida'
    })
});

// Validación de revisión
const reviewSchema = Joi.object({
  status: Joi.string()
    .valid('pendiente', 'revisado', 'rechazado')
    .required()
    .messages({
      'any.only': 'Estado de revisión inválido',
      'any.required': 'El estado es requerido'
    }),
  comment: Joi.string()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'El comentario no puede exceder 1000 caracteres'
    })
});

// Validación de actualización de usuario
const updateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres'
    }),
  email: Joi.string()
    .email()
    .lowercase()
    .messages({
      'string.email': 'Correo inválido'
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  amortizacionSchema,
  reviewSchema,
  updateUserSchema
};
