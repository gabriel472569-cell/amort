const JsonStore = require('./JsonStore');
const bcrypt = require('bcryptjs');

class User {
  static store = new JsonStore('users.json');

  static async initialize() {
    await this.store.load();
  }

  static async create(userData) {
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(userData.passwordHash, 10);
    
    const user = {
      id: this.store.getNextId(),
      name: userData.name,
      email: userData.email,
      passwordHash: hashedPassword,
      role: userData.role || 'student',
      createdAt: new Date().toISOString()
    };
    
    this.store.data.push(user);
    await this.store.save();
    return user;
  }

  static async findOne(options) {
    if (options.where && options.where.email) {
      return this.store.data.find(u => u.email === options.where.email);
    }
    if (options.where && options.where.id) {
      return this.store.data.find(u => u.id === options.where.id);
    }
    return null;
  }

  static async findByPk(id) {
    return this.store.data.find(u => u.id === id);
  }

  static async findAll() {
    return this.store.data;
  }

  static async update(userData) {
    const index = this.store.data.findIndex(u => u.id === userData.id);
    if (index !== -1) {
      this.store.data[index] = { ...this.store.data[index], ...userData };
      await this.store.save();
    }
    return this.store.data[index];
  }

  static async delete(id) {
    const index = this.store.data.findIndex(u => u.id === id);
    if (index !== -1) {
      this.store.data.splice(index, 1);
      await this.store.save();
      return true;
    }
    return false;
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
