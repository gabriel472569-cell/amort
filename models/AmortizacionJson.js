const JsonStore = require('./JsonStore');

class Amortizacion {
  static store = new JsonStore('amortizaciones.json');

  static async initialize() {
    await this.store.load();
  }

  static async findAll(options = {}) {
    let results = this.store.data;
    
    if (options.where) {
      if (options.where.userId) {
        results = results.filter(a => a.userId === options.where.userId);
      }
      if (options.where.status) {
        results = results.filter(a => a.status === options.where.status);
      }
    }
    
    return results;
  }

  static async findByPk(id, options = {}) {
    const amort = this.store.data.find(a => a.id === id);
    if (amort && options.include) {
      // Simular include de association
      return amort;
    }
    return amort;
  }

  static async create(data) {
    const amortizacion = {
      id: this.store.getNextId(),
      ...data,
      createdAt: new Date().toISOString()
    };
    this.store.data.push(amortizacion);
    await this.store.save();
    return amortizacion;
  }

  static async update(data) {
    const index = this.store.data.findIndex(a => a.id === data.id);
    if (index !== -1) {
      this.store.data[index] = { ...this.store.data[index], ...data };
      await this.store.save();
      return this.store.data[index];
    }
    return null;
  }

  static async destroy(options) {
    if (options.where && options.where.id) {
      this.store.data = this.store.data.filter(a => a.id !== options.where.id);
      await this.store.save();
      return 1;
    }
    return 0;
  }
}

module.exports = Amortizacion;
