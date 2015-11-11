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
ServerGameObject.prototype.getSerializedObjectsInRange = function getSerializedObjectsInRange() {
  const viewables = [];
  for (let prop in this.viewables) {
    viewables.push(prop);
  }

  const objs = this.getNearObjects().concat([this]);
  return objs.map(obj => {
    return obj.serialize(viewables);
  });
}

export default ServerGameObject;
