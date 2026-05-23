let User = null;
let Amortizacion = null;

const setUserModel = (userModel) => {
  User = userModel;
};

const setAmortizacionModel = (amortizacionModel) => {
  Amortizacion = amortizacionModel;
};

/**
 * Middleware para verificar autenticación
 */
async function requireAuth(req, res, next) {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
    }

    const user = await User.findByPk(userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({ error: 'Error en la autenticación' });
  }
}

/**
 * Middleware para verificar rol específico
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Acceso denegado. Rol insuficiente.' });
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  setUserModel,
  setAmortizacionModel
};
