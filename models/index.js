const { Sequelize } = require('sequelize');
const userModel = require('./User_Sequelize');
const amortizacionModel = require('./Amortizacion_Sequelize');

let sequelize;

const initializeDatabase = async (dbConfig) => {
  try {
    sequelize = new Sequelize(
      dbConfig.name,
      dbConfig.user,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: 'mysql',
        logging: false,
        timezone: '+00:00'
      }
    );

    // Importar modelos
    const User = userModel(sequelize);
    const Amortizacion = amortizacionModel(sequelize, User);

    // Sincronizar modelos con BD
    await sequelize.sync({ alter: true });

    console.log('✓ Conectado a MySQL');

    return { sequelize, User, Amortizacion };
  } catch (error) {
    console.error('✗ Error conectando a MySQL:', error.message);
    throw error;
  }
};

module.exports = { initializeDatabase };
