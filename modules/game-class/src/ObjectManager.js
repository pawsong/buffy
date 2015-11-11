import EventEmitter from 'eventemitter3';

class ObjectManager extends EventEmitter {
  constructor(objClass) {
    super();

    // TODO: should we use indexed object?
    // Candidate: https://facebook.github.io/immutable-js
    this._objs = {};

    this._class = objClass;
    this._update = this._class.update;

    this._evts = {};
  }

  create(options) {
    let obj = this.find(options.id);
    if (obj) {
      throw new Error('Object already exists');
    }

    obj = new this._class(this, options);
    this._objs[obj.id] = obj;

    this.emit('create', obj);
    return obj;
  }

  find(objId) {
    return this._objs[objId];
  }

  destroy(objId) {
    const obj = this.find(objId);
    if (!obj) { return; }

    delete this._objs[objId];
  }

  destroyAll() {
    this._objs = {};
    console.log('destroyall!');
    this.emit('destroyAll');
  }

  update(dt) {
    for (let id in this._objs) {
      this._update(dt, this._objs[id]);
    }
  }

  forEach(handler) {
    for (let id in this._objs) {
      const obj = this._objs[id];
      const ret = handler(obj);
      if (ret === false) {
        return;
      }
    }
  }

  getAllObjects() {
    return this._objs;
  }

  init(data) {
    // reset
    this.destroyAll();

    // Initialize store
    data.forEach(d => {
      const obj = this.create(d);
    });
  }

  propagate(handler) {
    if (!this._emitter) {
      throw new Error('Not connected');
    }

    Object.keys(this._evts).forEach(event => {
      this._emitter.on(event, data => {
        handler(event, data);
      });
    });

    // TODO: Return cancel function.
    return this;
  }

  connect(emitter) {
    if (this._emitter) {
      throw new Error('Already connected');
    }

    this._emitter = emitter;

    const listen = (event, handler) => {
      this._evts[event] = true;
      emitter.on(event, handler);
    };

    listen('init', data => {
      this.init(data);
    });

    listen('move', data => {
      const obj = this.find(data.id);
      if (!obj) {
        // TODO: Request missing object data to server.
        // Out of sync in this case. We may have to reset all data.
        console.error('Client and server out of sync!');
        console.error(`Cannot find object ${data.id}`);
        return;
      }
      obj.tween.import(data.tween);
    });

    return this;
  }

  dump() {
    return Object.keys(this._objs).map(key => {
      return this._objs[key].serialize();
    });
  }

  getAllObjects() {
    return Object.keys(this._objs).map(key => {
      return this._objs[key];
    });
  }
}
export default ObjectManager;
