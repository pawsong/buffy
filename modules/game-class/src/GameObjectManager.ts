class GameObjectManager {
  private _objs: any;
  private _class: any;
  
  constructor(objClass) {

    // TODO: should we use indexed object?
    // Candidate: https://facebook.github.io/immutable-js
    this._objs = {};
    this._class = objClass;
  }

  serialize() {
    return Object.keys(this._objs).map(key => {
      return this._objs[key].serialize();
    });
  }

  deserialize(objects) {
    this.destroyAll();
    objects.forEach(d => this.create(d));
  }

  create(options) {
    let obj = this.find(options.id);
    if (obj) {
      throw new Error('Object already exists');
    }

    obj = new this._class(this, options);
    this._objs[obj.id] = obj;
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
  }

  update(dt) {
    for (let id in this._objs) {
      this._objs[id].update(dt);
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
    return Object.keys(this._objs).map(key => {
      return this._objs[key];
    });
  }
}
export default GameObjectManager;
