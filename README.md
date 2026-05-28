# 📊 Panel de Amortizaciones - Sistema de Gestión Financiera

Plataforma profesional para estudiantes de Administración de Empresas que gestionan y revisan planes de pago con cálculos automáticos de amortizaciones.

## ✨ Características

- ✅ Registro e inicio de sesión seguros
- ✅ Modal de confirmación de registro (éxito/error)
- ✅ Validación obligatoria de contraseña (mínimo 6 caracteres)
- ✅ Interfaz moderna con diseño responsive y animaciones
- ✅ Cálculo automático de amortizaciones
- ✅ Generación de PDF con resumen
- ✅ **Almacenamiento de datos en archivos JSON** (sin base de datos)
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Roles: Estudiante y Profesor
- ✅ Listo para desplegar en cualquier hosting

## 🏗️ Almacenamiento de Datos (JSON)

Los datos se guardan en archivos JSON en la raíz del proyecto:

```
📁 /workspaces/amort/
├── users.json              # Datos de usuarios registrados
├── amortizaciones.json     # Cálculos de amortizaciones guardados
└── [otros archivos...]
```

**Estructura de users.json:**
```json
[
  {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@test.com",
    "passwordHash": "$2a$10$...",  // Hasheado con bcrypt
    "role": "student",
    "createdAt": "2026-05-28T22:57:18.056Z"
  }
]
```

**Ventajas del almacenamiento JSON:**
- 📁 Sin necesidad de base de datos
- ⚡ Rápido y simple
- 🔒 Seguro (contraseñas hasheadas)
- 📤 Fácil de desplegar
- 📊 Fácil de inspeccionar y debuggear

## 🚀 Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/gabriel472569-cell/amort.git
cd amort

# 2. Instalar dependencias
npm install

# 3. Crear archivo .env
echo "SESSION_SECRET=tu-clave-secreta-aqui" > .env
echo "PORT=3000" >> .env
echo "NODE_ENV=development" >> .env

# 4. Iniciar servidor
npm start
```

El servidor estará disponible en: **http://localhost:3000**

## 📝 Uso de la Aplicación

### 1. Registro
1. Completa nombre, email y contraseña (mínimo 6 caracteres)
2. Aparecerá modal con confirmación de éxito o error
3. Los datos se guardan automáticamente en `users.json` (hasheados)

### 2. Login
1. Usa el email y contraseña registrados
2. Se crea una sesión automática

### 3. Generar Amortización (Estudiante)
1. Ingresa monto, tasa, plazo y pagos por año
2. El sistema calcula automáticamente:
   - Pago periódico
   - Total pagado
   - Total intereses
3. Guarda en `amortizaciones.json`

### 4. Descargar PDF
1. En "Ver mis registros", haz clic en botón "PDF"
2. Se descarga automáticamente el cálculo

### 5. Revisar Envíos (Profesor)
1. Accede como profesor
2. Ver lista de envíos de estudiantes
3. Revisar y comentar amortizaciones

## 📂 Estructura del Proyecto

```
amort/
├── public/
│   ├── index.html          # Interfaz principal
│   ├── app.js              # Lógica del cliente
│   └── styles.css          # Estilos responsive
├── models/
│   ├── UserJson.js         # Modelo de usuarios (JSON)
│   ├── AmortizacionJson.js # Modelo de amortizaciones (JSON)
│   ├── JsonStore.js        # Gestor de archivos JSON
│   └── index.js            # Inicializador
├── middleware/
│   ├── auth.js             # Autenticación y autorización
│   └── rateLimiter.js      # Limitador de tasa
├── validators/
│   └── schemas.js          # Esquemas de validación
├── server.js               # Servidor Express
├── users.json              # Base de datos usuarios (generado)
├── amortizaciones.json     # Base de datos amortizaciones (generado)
├── netlify.toml            # Configuración Netlify
└── package.json
```

## 🌐 Despliegue en la Nube

### ⭐ Opción 1: Railway (RECOMENDADO)

Guarda datos persistentes en servidor:

1. Accede a https://railway.app
2. Haz login/registro con GitHub
3. Crea nuevo proyecto
4. Conecta tu repositorio `gabriel472569-cell/amort`
5. Configura variables de entorno:
   ```
   SESSION_SECRET=tu-clave-muy-segura
   NODE_ENV=production
   PORT=3000
   ```
6. ¡Listo! Tu app estará en línea

**Ventajas:**
- ✅ Almacenamiento persistente
- ✅ Datos guardados en el servidor
- ✅ Gratis (hasta cierto límite)
- ✅ Subdominio automático

### Opción 2: Render

Similar a Railway: https://render.com

### Opción 3: Vercel

Para Node.js fullstack: https://vercel.com

## 🔧 Variables de Entorno

Crea un archivo `.env` en la raíz:

```
SESSION_SECRET=tu-clave-secreta-muy-segura-aqui
PORT=3000
NODE_ENV=development
```

**En producción:**
- Cambiar `SESSION_SECRET` a algo complejo
- Cambiar `NODE_ENV=production`
- HTTPS es automático en hosting

## 👤 Credenciales Demo

```
Email: usuario@empresa.com
Contraseña: admin123
Rol: Profesor
```

O crea tu propia cuenta registrándote.

## 🔐 Seguridad

- 🔐 Contraseñas hasheadas con **bcrypt** (10 rondas)
- 🔐 Sesiones HTTP-only con `express-session`
- 🔐 Rate limiting en endpoints críticos
- 🔐 Validación de esquemas con `joi`
- 🔐 Helmet.js para headers de seguridad

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrarse
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/logout` - Cerrar sesión

### Amortizaciones
- `GET /api/amortizaciones` - Listar mis amortizaciones
- `POST /api/amortizaciones` - Crear nueva
- `PUT /api/amortizaciones/:id` - Actualizar
- `DELETE /api/amortizaciones/:id` - Eliminar
- `GET /api/amortizaciones/:id/export-pdf` - Descargar PDF

### Usuarios (solo profesor)
- `GET /api/users` - Listar estudiantes
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

## 🛠️ Stack Tecnológico

**Backend:**
- Node.js + Express
- Bcryptjs (encriptación)
- PDFKit (generación de PDF)
- Joi (validación)
- Express-session (sesiones)

**Frontend:**
- HTML5
- CSS3 (Grid, Flexbox, Gradientes)
- JavaScript Vanilla
- Responsive Design

## 🐛 Solución de Problemas

### Error: "No autorizado. Debes iniciar sesión"
- Asegúrate de haber hecho login
- Recarga la página `F5`
- Limpia cookies del navegador

### Las amortizaciones no se guardan
- Verifica que `amortizaciones.json` exista
- Revisa permisos de carpeta en el servidor
- Reinicia el servidor

### Error de contraseña al login
- La contraseña distingue mayúsculas/minúsculas
- Mínimo 6 caracteres en registro
- Las contraseñas se hashean: no se pueden recuperar

### Puerto 3000 en uso
```bash
# Matar proceso en puerto 3000
lsof -i :3000 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

## 📞 Soporte

Para issues o sugerencias: https://github.com/gabriel472569-cell/amort/issues

## 📄 Licencia

MIT - Libre para usar en proyectos personales y educativos

---

**Hecho con ❤️ para estudiantes de Administración de Empresas**

*Último actualización: Mayo 2026*
