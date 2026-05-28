const Database = require('./Database');
const User = require('./UserSqlite');
const Amortizacion = require('./AmortizacionSqlite');

const initializeDatabase = async () => {
  try {
    const db = new Database();
    
    // Esperar a que la BD esté lista
    await new Promise(resolve => setTimeout(resolve, 100));

    // Crear tablas
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        createdAt TEXT
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS amortizaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        studentName TEXT,
        nombre TEXT,
        monto REAL,
        tasaAnual REAL,
        plazoAnios INTEGER,
        pagosAno INTEGER,
        pagoPeriodo REAL,
        totalPagado REAL,
        totalInteres REAL,
        status TEXT DEFAULT 'pendiente',
        reviewComment TEXT,
        reviewedAt TEXT,
        createdAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    // Asignar BD a modelos
    User.setDb(db);
    Amortizacion.setDb(db);

    // Verificar si ya existen datos
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    
    if (userCount.count === 0) {
      // Agregar usuario demo
      await User.create({
        name: 'Administrador',
        email: 'usuario@empresa.com',
        passwordHash: 'admin123',
        role: 'teacher'
      });

      await User.create({
        name: 'Alumno',
        email: 'alumno1@ejemplo.com',
        passwordHash: 'alumno123',
        role: 'student'
      });

      console.log('✓ Usuarios demo creados');
    }

    return { db, User, Amortizacion };
  } catch (error) {
    console.error('✗ Error inicializando BD:', error.message);
    throw error;
  }
};

module.exports = { initializeDatabase };
