const objectAssign = require('object-assign');

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
    this.data = objectAssign({}, this.data, data);
    this.listeners.forEach(listener => listener(this.data));
  }

  listen(listener: StoreListener<T>) {
    this.listeners.push(listener);
  }

  removeAllListeners() {
    this.listeners = [];
  }

  getState() {
    return this.data;
  }
}

export default SimpleStore;
