const UserJson = require('./UserJson');
const AmortizacionJson = require('./AmortizacionJson');

const initializeDatabase = async () => {
  try {
    // Inicializar almacenamiento JSON
    await UserJson.initialize();
    await AmortizacionJson.initialize();

    // Verificar si ya existen datos
    const users = await UserJson.findAll();
    
    if (users.length === 0) {
      // Agregar usuario demo
      await UserJson.create({
        name: 'Administrador',
        email: 'usuario@empresa.com',
        passwordHash: 'admin123',
        role: 'teacher'
      });

      await UserJson.create({
        name: 'Alumno',
        email: 'alumno1@ejemplo.com',
        passwordHash: 'alumno123',
        role: 'student'
      });

      console.log('✓ Usuarios demo creados en users.json');
    }

    console.log('✓ Base de datos JSON inicializada');
    return { User: UserJson, Amortizacion: AmortizacionJson };
  } catch (error) {
    console.error('✗ Error inicializando BD:', error.message);
    throw error;
  }
};

module.exports = { initializeDatabase };
