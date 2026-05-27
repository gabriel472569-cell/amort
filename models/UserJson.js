const JsonStore = require('./JsonStore');
const bcrypt = require('bcryptjs');

class User {
  static store = new JsonStore('users.json');

  static async initialize() {
    await this.store.load();
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

  static async create(userData) {
    const user = {
      id: this.store.getNextId(),
      name: userData.name,
      email: userData.email,
      passwordHash: userData.passwordHash,
      role: userData.role || 'student',
      createdAt: new Date().toISOString()
    };
    this.store.data.push(user);
    await this.store.save();
    return {
      ...user,
      toJSON: () => user
    };
  }

  static async findAll() {
    return this.store.data;
  }

  static async update(user) {
    const index = this.store.data.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.store.data[index] = user;
      await this.store.save();
    }
    return user;
  }
}

module.exports = User;
