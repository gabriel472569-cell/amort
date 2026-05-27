const User = require('./UserJson');
const Amortizacion = require('./AmortizacionJson');

const initializeDatabase = async (dbConfig) => {
  try {
    // Inicializar stores JSON
    await User.initialize();
    await Amortizacion.initialize();

    console.log('✓ Datos cargados desde JSON');

    return { User, Amortizacion };
  } catch (error) {
    console.error('✗ Error inicializando:', error.message);
    throw error;
  }
};

module.exports = { initializeDatabase };
