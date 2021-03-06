interface StoreListener<T> {
  (data: T): any;
}

class SimpleStore<T> {
  data: T;
  listeners: StoreListener<T>[];
  constructor(data: T) {
    this.data = data;
    this.listeners = [];
  }

  update(data: T) {
    this.data = data;
    this.listeners.forEach(listener => listener(this.data));
  }

  listen(listener: StoreListener<T>) {
    this.listeners.push(listener);
    listener(this.data);
  }

  unlisten(listener: StoreListener<T>) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) this.listeners.splice(index, 1);
  }

  removeAllListeners() {
    this.listeners = [];
  }

  getState() {
    return this.data;
  }
}

export default SimpleStore;
