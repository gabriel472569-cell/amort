require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const PDFDocument = require('pdfkit');
const { initializeDatabase } = require('./models/index');

// Importar middleware y validadores
const { requireAuth, requireRole, setUserModel, setAmortizacionModel } = require('./middleware/auth');
const { loginLimiter, registerLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { registerSchema, loginSchema, amortizacionSchema, reviewSchema, updateUserSchema } = require('./validators/schemas');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;

// Validar variables de entorno
if (!SESSION_SECRET) {
  console.error('ERROR: La variable de entorno SESSION_SECRET es requerida.');
  process.exit(1);
}

// Validar configuración de BD
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  name: process.env.DB_NAME || 'amortizaciones',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

// Variables globales para modelos
let User, Amortizacion;

// MIDDLEWARE DE SEGURIDAD
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));

// Aplicar rate limiting
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api', apiLimiter);

// INICIALIZAR BD
(async () => {
  try {
    const db = await initializeDatabase();
    User = db.User;
    Amortizacion = db.Amortizacion;
    
    // Asignar modelos a middleware
    setUserModel(User);
    setAmortizacionModel(Amortizacion);
    
    console.log('✓ Servidor iniciado en http://localhost:' + PORT);
    console.log('✓ Ambiente: ' + (process.env.NODE_ENV || 'development'));
  } catch (error) {
    console.error('✗ Error inicializando:', error.message);
    process.exit(1);
  }
})();

// SEED DATA
async function seedData() {
  try {
    const adminEmail = 'usuario@empresa.com';
    const existingAdmin = await User.findOne({ 
      where: { email: adminEmail, role: 'teacher' } 
    });
    
    if (!existingAdmin) {
      await User.create({
        name: 'Administrador',
        email: adminEmail,
        passwordHash: 'admin123',
        role: 'teacher'
      });
      console.log('✓ Usuario admin creado');
    }
  } catch (error) {
    console.error('Error en seed data:', error.message);
  }
}

// FUNCIONES AUXILIARES
function calcularPago(monto, tasaAnual, plazoAnios, pagosAno) {
  const tasaPeriodo = tasaAnual / 100 / pagosAno;
  const numeroPagos = plazoAnios * pagosAno;

  if (tasaPeriodo === 0) {
    return monto / numeroPagos;
  }

  return (monto * tasaPeriodo * Math.pow(1 + tasaPeriodo, numeroPagos)) / 
         (Math.pow(1 + tasaPeriodo, numeroPagos) - 1);
}

// ============= ROUTES =============

// ===== AUTH ROUTES =====
app.post('/api/auth/register', registerLimiter, async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const existingUser = await User.findOne({ where: { email: value.email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email ya registrado' });
    }

    const user = await User.create({
      name: value.name,
      email: value.email,
      passwordHash: value.password,
      role: 'student'
    });

    req.session.userId = user.id;
    res.status(201).json({ 
      message: 'Usuario registrado exitosamente',
      user: User.toJSON(user)
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user = await User.findOne({ where: { email: value.email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isPasswordValid = await User.comparePassword(value.password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    req.session.userId = user.id;

    res.json({ 
      message: 'Login exitoso',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
    res.json({ message: 'Sesión cerrada' });
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(User.toJSON(req.user));
});

// ===== USER ROUTES =====
app.get('/api/users', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const students = await User.findAll({ 
      where: { role: 'student' },
      attributes: { exclude: ['passwordHash'] }
    });
    res.json(students);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.put('/api/users/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (value.email && value.email !== user.email) {
      const existingEmail = await User.findOne({ where: { email: value.email } });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email ya en uso' });
      }
    }

    await user.update(value);
    res.json({ message: 'Usuario actualizado', user: user.toJSON() });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.delete('/api/users/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    await Amortizacion.destroy({ where: { userId: user.id } });
    await user.destroy();

    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ===== AMORTIZACION ROUTES =====
app.get('/api/amortizaciones', requireAuth, async (req, res) => {
  try {
    let amortizaciones;
    
    if (req.user.role === 'teacher') {
      amortizaciones = await Amortizacion.findAll({
        include: [
          { association: 'creator', attributes: ['id', 'name', 'email'] },
          { association: 'reviewer', attributes: ['id', 'name', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else {
      amortizaciones = await Amortizacion.findAll({
        where: { userId: req.user.id },
        include: [
          { association: 'creator', attributes: ['id', 'name', 'email'] },
          { association: 'reviewer', attributes: ['id', 'name', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    res.json(amortizaciones);
  } catch (error) {
    console.error('Error obteniendo amortizaciones:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/api/amortizaciones', requireAuth, async (req, res) => {
  try {
    const { error, value } = amortizacionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const pagoPeriodo = calcularPago(value.monto, value.tasaAnual, value.plazoAnios, value.pagosAno);
    const totalInteres = (pagoPeriodo * value.plazoAnios * value.pagosAno) - value.monto;

    const amortizacion = await Amortizacion.create({
      userId: req.user.id,
      studentName: req.user.name,
      nombre: value.nombre,
      monto: value.monto,
      tasaAnual: value.tasaAnual,
      plazoAnios: value.plazoAnios,
      pagosAno: value.pagosAno,
      pagoPeriodo: pagoPeriodo,
      totalInteres: totalInteres
    });

    res.status(201).json({ 
      message: 'Amortización creada',
      amortizacion 
    });
  } catch (error) {
    console.error('Error creando amortización:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/api/amortizaciones/:id', requireAuth, async (req, res) => {
  try {
    const amortizacion = await Amortizacion.findByPk(req.params.id, {
      include: [
        { association: 'creator', attributes: ['id', 'name', 'email'] },
        { association: 'reviewer', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!amortizacion) return res.status(404).json({ error: 'Amortización no encontrada' });

    if (req.user.role !== 'teacher' && amortizacion.userId !== req.user.id) {
      return res.status(403).json({ error: 'No tiene acceso a este recurso' });
    }

    res.json(amortizacion);
  } catch (error) {
    console.error('Error obteniendo amortización:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.put('/api/amortizaciones/:id', requireAuth, async (req, res) => {
  try {
    const { error, value } = amortizacionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const amortizacion = await Amortizacion.findByPk(req.params.id);
    if (!amortizacion) return res.status(404).json({ error: 'Amortización no encontrada' });

    if (req.user.role !== 'teacher' && amortizacion.userId !== req.user.id) {
      return res.status(403).json({ error: 'No puede editar esta amortización' });
    }

    const pagoPeriodo = calcularPago(value.monto, value.tasaAnual, value.plazoAnios, value.pagosAno);
    const totalInteres = (pagoPeriodo * value.plazoAnios * value.pagosAno) - value.monto;

    await amortizacion.update({
      nombre: value.nombre,
      monto: value.monto,
      tasaAnual: value.tasaAnual,
      plazoAnios: value.plazoAnios,
      pagosAno: value.pagosAno,
      pagoPeriodo: pagoPeriodo,
      totalInteres: totalInteres
    });

    res.json({ message: 'Amortización actualizada', amortizacion });
  } catch (error) {
    console.error('Error actualizando amortización:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.delete('/api/amortizaciones/:id', requireAuth, async (req, res) => {
  try {
    const amortizacion = await Amortizacion.findByPk(req.params.id);
    if (!amortizacion) return res.status(404).json({ error: 'Amortización no encontrada' });

    if (req.user.role !== 'teacher' && amortizacion.userId !== req.user.id) {
      return res.status(403).json({ error: 'No puede eliminar esta amortización' });
    }

    await amortizacion.destroy();
    res.json({ message: 'Amortización eliminada' });
  } catch (error) {
    console.error('Error eliminando amortización:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/api/amortizaciones/:id/review', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { error, value } = reviewSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const amortizacion = await Amortizacion.findByPk(req.params.id);
    if (!amortizacion) return res.status(404).json({ error: 'Amortización no encontrada' });

    await amortizacion.update({
      status: value.status,
      reviewComment: value.comment || null,
      reviewedAt: new Date(),
      reviewedBy: req.user.id
    });

    await amortizacion.reload({
      include: [
        { association: 'creator', attributes: ['id', 'name', 'email'] },
        { association: 'reviewer', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({ message: 'Reseña completada', amortizacion });
  } catch (error) {
    console.error('Error en reseña:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/api/amortizaciones/:id/export-pdf', requireAuth, async (req, res) => {
  try {
    const amortizacion = await Amortizacion.findByPk(req.params.id, {
      include: [{ association: 'creator', attributes: ['id', 'name', 'email'] }]
    });

    if (!amortizacion) return res.status(404).json({ error: 'Amortización no encontrada' });

    if (req.user.role !== 'teacher' && amortizacion.userId !== req.user.id) {
      return res.status(403).json({ error: 'No tiene acceso a este PDF' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="amortizacion.pdf"');

    doc.pipe(res);
    doc.fontSize(20).text('Plan de Amortización', 100, 50);
    doc.fontSize(12);
    doc.text(`Estudiante: ${amortizacion.studentName}`, 100, 100);
    doc.text(`Concepto: ${amortizacion.nombre}`, 100, 130);
    doc.text(`Monto: $${amortizacion.monto}`, 100, 160);
    doc.text(`Tasa Anual: ${amortizacion.tasaAnual}%`, 100, 190);
    doc.text(`Plazo: ${amortizacion.plazoAnios} años`, 100, 220);
    doc.text(`Pago Período: $${amortizacion.pagoPeriodo}`, 100, 250);
    doc.text(`Total Intereses: $${amortizacion.totalInteres}`, 100, 280);
    doc.text(`Estado: ${amortizacion.status}`, 100, 310);

    doc.end();
  } catch (error) {
    console.error('Error en PDF:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// FALLBACK ROUTE
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log(`✓ Servidor escuchando en puerto ${PORT}`);
});
