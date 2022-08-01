export default class Counter {
  map; // Map<T, number>

  constructor() {
    this.map = new Map();
  }

  amount() {
    return this.map.size;
  }

  get(item) {
    const count = this.map.get(item) || 0;
    return count;
  }

  add(item) {
    const count = this.get(item);
    this.map.set(item, count + 1);
  }

  delete(item) {
    const count = this.get(item) - 1;
    if (count === 0) {
      this.map.delete(item);
    } else {
      this.map.set(item, count);
    }
  }
}
