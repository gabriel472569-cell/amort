const fs = require('fs').promises;
const path = require('path');

class JsonStore {
  constructor(filename) {
    this.filePath = path.join(__dirname, '..', filename);
    this.data = [];
  }

  async load() {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      this.data = JSON.parse(content);
    } catch (error) {
      this.data = [];
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
  }

  getNextId() {
    if (this.data.length === 0) return 1;
    return Math.max(...this.data.map(item => item.id || 0)) + 1;
  }
}

module.exports = JsonStore;
