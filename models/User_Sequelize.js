const { DataTypes } = require('sequelize');
const bcryptjs = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      lowercase: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('student', 'teacher'),
      defaultValue: 'student'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash && user.passwordHash.length < 100) {
          user.passwordHash = await bcryptjs.hash(user.passwordHash, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash') && user.passwordHash.length < 100) {
          user.passwordHash = await bcryptjs.hash(user.passwordHash, 10);
        }
      }
    }
  });

  // Método para comparar contraseñas
  User.prototype.comparePassword = async function(password) {
    return await bcryptjs.compare(password, this.passwordHash);
  };

  // Método para obtener datos sin contraseña
  User.prototype.toJSON = function() {
    const user = this.get();
    delete user.passwordHash;
    return user;
  };

  return User;
};
