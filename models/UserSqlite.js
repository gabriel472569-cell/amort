const bcrypt = require('bcryptjs');

class User {
  static db = null;

  static setDb(database) {
    this.db = database;
  }

  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.passwordHash, 10);
    
    const result = await this.db.run(
      `INSERT INTO users (name, email, passwordHash, role, createdAt) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        userData.name,
        userData.email,
        hashedPassword,
        userData.role || 'student',
        new Date().toISOString()
      ]
    );

    return this.findByPk(result.id);
  }

  static async findOne(options) {
    if (options.where && options.where.email) {
      return this.db.get('SELECT * FROM users WHERE email = ?', [options.where.email]);
    }
    if (options.where && options.where.id) {
      return this.db.get('SELECT * FROM users WHERE id = ?', [options.where.id]);
    }
    return null;
  }

  static async findByPk(id) {
    return this.db.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  static async findAll() {
    return this.db.all('SELECT * FROM users');
  }

  static async update(userData) {
    await this.db.run(
      `UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?`,
      [userData.name, userData.email, userData.role, userData.id]
    );
    return this.findByPk(userData.id);
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static toJSON(user) {
    if (!user) return null;
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = User;
