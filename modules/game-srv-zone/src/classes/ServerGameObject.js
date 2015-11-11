import { GameObject } from '@pasta/game-class';

const defaultViewables = {
  id: true,
  position: true,
  tween: 'dump',
};

/*
 * Constructor
 */
class ServerGameObject extends GameObject {
  constructor(manager, options) {
    super(manager, options);
    this.viewables = Object.create(defaultViewables);
  }
}

/*
 * Private methods (user cannot see these)
 */
ServerGameObject.update = function update(dt, obj) {
  GameObject.update(dt, obj);
}

/*
 * Public methods (user can use these)
 */
ServerGameObject.prototype.dump = function dump() {
  const viewables = [];
  for (let prop in this.viewables) {
    viewables.push(prop);
  }

  //const objs = this.getNearObjects().concat([this]);
  const objs = this.getNearObjects();
  return objs.map(obj => {
    const ret = {};
    viewables.forEach(prop => {
      ret[prop] = obj[prop];
    });
    return ret;
  });
}

export default ServerGameObject;
