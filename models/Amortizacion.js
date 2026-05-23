const mongoose = require('mongoose');

const amortizacionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID del usuario es requerido'],
      index: true
    },
    studentName: {
      type: String,
      required: true
    },
    nombre: {
      type: String,
      required: [true, 'El nombre de la amortización es requerido'],
      trim: true,
      maxlength: [200, 'El nombre no puede exceder 200 caracteres']
    },
    monto: {
      type: Number,
      required: [true, 'El monto es requerido'],
      min: [0, 'El monto debe ser positivo'],
      max: [1000000000, 'El monto no puede exceder 1 billón']
    },
    tasaAnual: {
      type: Number,
      required: [true, 'La tasa anual es requerida'],
      min: [0, 'La tasa debe ser no negativa'],
      max: [100, 'La tasa no puede exceder 100%']
    },
    plazoAnios: {
      type: Number,
      required: [true, 'El plazo es requerido'],
      min: [1, 'El plazo debe ser al menos 1 año'],
      max: [100, 'El plazo no puede exceder 100 años']
    },
    pagosAno: {
      type: Number,
      required: [true, 'La frecuencia de pago es requerida'],
      enum: [1, 2, 4, 12, 24, 26, 52],
      message: 'Frecuencia de pago inválida'
    },
    pagoPeriodo: {
      type: Number,
      required: true
    },
    totalPagado: {
      type: Number,
      required: true
    },
    totalInteres: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pendiente', 'revisado', 'rechazado'],
      default: 'pendiente'
    },
    reviewComment: {
      type: String,
      default: '',
      maxlength: [1000, 'El comentario no puede exceder 1000 caracteres']
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { collection: 'amortizaciones' }
);

// Índices para optimizar consultas
amortizacionSchema.index({ userId: 1, createdAt: -1 });
amortizacionSchema.index({ status: 1, createdAt: -1 });

// Middleware para actualizar updatedAt
amortizacionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Amortizacion', amortizacionSchema);
