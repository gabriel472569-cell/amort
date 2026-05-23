const { DataTypes } = require('sequelize');

module.exports = (sequelize, User) => {
  const Amortizacion = sequelize.define('Amortizacion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    studentName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    monto: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 1000000000
      }
    },
    tasaAnual: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    plazoAnios: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 100
      }
    },
    pagosAno: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isIn: [[1, 2, 4, 12, 24, 26, 52]]
      }
    },
    pagoPeriodo: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Calculado: monto / (plazoAnios * pagosAno)'
    },
    totalPagado: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: 'Total pagado por estudiante'
    },
    totalInteres: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Interés total a pagar'
    },
    status: {
      type: DataTypes.ENUM('pendiente', 'revisado', 'rechazado'),
      defaultValue: 'pendiente'
    },
    reviewComment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    tableName: 'amortizaciones',
    indexes: [
      {
        fields: ['userId', 'createdAt']
      },
      {
        fields: ['status', 'createdAt']
      }
    ]
  });

  // Asociaciones
  Amortizacion.belongsTo(User, {
    foreignKey: 'userId',
    as: 'creator',
    onDelete: 'CASCADE'
  });

  Amortizacion.belongsTo(User, {
    foreignKey: 'reviewedBy',
    as: 'reviewer',
    allowNull: true
  });

  return Amortizacion;
};
