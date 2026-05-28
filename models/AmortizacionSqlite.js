class Amortizacion {
  static db = null;

  static setDb(database) {
    this.db = database;
  }

  static async create(data) {
    const result = await this.db.run(
      `INSERT INTO amortizaciones 
       (userId, studentName, nombre, monto, tasaAnual, plazoAnios, pagosAno, 
        pagoPeriodo, totalPagado, totalInteres, status, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.userId,
        data.studentName,
        data.nombre,
        data.monto,
        data.tasaAnual,
        data.plazoAnios,
        data.pagosAno,
        data.pagoPeriodo,
        data.totalPagado,
        data.totalInteres,
        data.status || 'pendiente',
        new Date().toISOString()
      ]
    );
    return this.findByPk(result.id);
  }

  static async findAll(options = {}) {
    let sql = 'SELECT * FROM amortizaciones ORDER BY createdAt DESC';
    let params = [];

    if (options.where) {
      const conditions = [];
      if (options.where.userId) {
        conditions.push('userId = ?');
        params.push(options.where.userId);
      }
      if (options.where.status) {
        conditions.push('status = ?');
        params.push(options.where.status);
      }
      if (conditions.length > 0) {
        sql = `SELECT * FROM amortizaciones WHERE ${conditions.join(' AND ')} ORDER BY createdAt DESC`;
      }
    }

    return this.db.all(sql, params);
  }

  static async findByPk(id) {
    return this.db.get('SELECT * FROM amortizaciones WHERE id = ?', [id]);
  }

  static async update(data) {
    await this.db.run(
      `UPDATE amortizaciones SET 
       studentName = ?, nombre = ?, monto = ?, tasaAnual = ?, plazoAnios = ?,
       pagosAno = ?, pagoPeriodo = ?, totalPagado = ?, totalInteres = ?, 
       status = ?, reviewComment = ?, reviewedAt = ? WHERE id = ?`,
      [
        data.studentName,
        data.nombre,
        data.monto,
        data.tasaAnual,
        data.plazoAnios,
        data.pagosAno,
        data.pagoPeriodo,
        data.totalPagado,
        data.totalInteres,
        data.status,
        data.reviewComment,
        data.reviewedAt,
        data.id
      ]
    );
    return this.findByPk(data.id);
  }

  static async destroy(options) {
    if (options.where && options.where.id) {
      const result = await this.db.run(
        'DELETE FROM amortizaciones WHERE id = ?',
        [options.where.id]
      );
      return result.changes;
    }
    return 0;
  }
}

module.exports = Amortizacion;
