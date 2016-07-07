class WeakTable<T1, T2, T3, T4, V> {
  private data: WeakMap<T1, any>;

  constructor() {
    this.data = new WeakMap<T1, any>();
  }

  private get1(k1: T1) {
    return this.data.get(k1);
  }

  protected get2(k1: T1, k2: T2) {
    const map = this.get1(k1);
    if (!map) return;
    return map.get(k2);
  }

  protected get3(k1: T1, k2: T2, k3: T3) {
    const map = this.get2(k1, k2);
    if (!map) return;
    return map.get(k3);
  }

  protected get4(k1: T1, k2: T2, k3: T3, k4: T4) {
    const map = this.get3(k1, k2, k3);
    if (!map) return;
    return map.get(k4);
  }

  private set1(k1: T1, val: V) {
    this.data.set(k1, val);
    return this;
  }

  protected set2(k1: T1, k2: T2, val: V) {
    let map = this.get1(k1);
    if (!map) {
      map = new WeakMap<T2, any>();
      this.set1(k1, map);
    }
    map.set(k2, val);
    return this;
  }

  protected set3(k1: T1, k2: T2, k3: T3, val: V) {
    let map = this.get2(k1, k2);
    if (!map) {
      map = new WeakMap<T3, any>();
      this.set2(k1, k2, map);
    }
    map.set(k3, val);
    return this;
  }

  protected set4(k1: T1, k2: T2, k3: T3, k4: T4, val: V) {
    let map = this.get3(k1, k2, k3);
    if (!map) {
      map = new WeakMap<T4, any>();
      this.set3(k1, k2, k3, map);
    }
    map.set(k4, val);
    return this;
  }
}

class WeakTable2<T1, T2, V> extends WeakTable<T1, T2, void, void, V> {
  get(k1: T1, k2: T2) {
    return this.get2(k1, k2);
  }

  set(k1: T1, k2: T2, val: V) {
    return this.set2(k1, k2, val);
  }
}

class WeakTable3<T1, T2, T3, V> extends WeakTable<T1, T2, T3, void, V> {
  get(k1: T1, k2: T2, k3: T3) {
    return this.get3(k1, k2, k3);
  }

  set(k1: T1, k2: T2, k3: T3, val: V) {
    return this.set3(k1, k2, k3, val);
  }
}

class WeakTable4<T1, T2, T3, T4, V> extends WeakTable<T1, T2, T3, T4, V> {
  get(k1: T1, k2: T2, k3: T3, k4: T4) {
    return this.get4(k1, k2, k3, k4);
  }

  set(k1: T1, k2: T2, k3: T3, k4: T4, val: V) {
    return this.set4(k1, k2, k3, k4, val);
  }
}

export {
  WeakTable2,
  WeakTable3,
  WeakTable4,
};
