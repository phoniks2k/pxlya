export default class Counter<T> {
  map: Map<T, number>;

  constructor() {
    this.map = new Map();
  }

  amount(): number {
    return this.map.size;
  }

  get(item: T): number {
    const count = this.map.get(item) || 0;
    return count;
  }

  add(item: T): void {
    const count = this.get(item);
    this.map.set(item, count + 1);
  }

  delete(item: T): void {
    const count = this.get(item) - 1;
    if (count === 0) {
      this.map.delete(item);
    } else {
      this.map.set(item, count);
    }
  }
}
