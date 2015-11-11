import TWEEN from '@pasta/tween.js';
import _ from 'lodash';

/*
 * Serialize and deserialize functions
 *
 * null => as is
 */
const SerDes = {

  id: null,

  position: null,

  tween: {
    serialize: function (value) {
      return value.toJSON();
    },

    deserialize: function (value) {
      this.restore(value);
    },
  }
};

const AllViewables = Object.keys(SerDes);

/*
 * Constructor
 */
class GameObject {
  constructor(manager, options) {
    // Initialize data
    this.id = options.id;
    this.position = options.position;
    this.tween = new TWEEN.Tween(this.position);
    this.manager = manager;

    if (options.tween) {
      this.tween.import(options.tween);
    }

    // Emit move event to manager.
    this.tween.onStart(() => {
      manager.emit('start', this);
    });

    this.tween.onUpdate((value, newPos) => {
      // TODO: Check if update is valid.
      // should return false to stop moving.

      manager.emit('move', this, newPos, this.position);
    });

    this.tween.onStop(() => {
      manager.emit('stop', this);
    });
  }

  serialize() {
    console.log(this.tween);
    return {
      id: this.id,
      position: this.position,
      tween: this.tween.toJSON(),
    };
  }
}

function updatePosition(dt, obj) {
  if (!obj.tween.isPlaying()) { return; }
  return obj.tween.update2(dt);
}

/*
 * Private methods (user cannot see these)
 */
GameObject.update = function update(dt, obj) {
  // Finished or onUpdate returned false
  if (false === updatePosition(dt, obj)) {
    obj.tween.stop();
  }
}

/*
 * Public methods (user can use these)
 */
GameObject.prototype.getNearObjects = function getNearObjects(distance = Infinity) {

  const objects = this.manager.getAllObjects();

  const idx = _.findIndex(objects, obj => {
    return obj.id === this.id;
  });

  if (idx > -1) {
    objects.splice(idx, 1);
  }
  return objects;
}

/**
 * Returns plain object.
 */
GameObject.prototype.serialize = function serialize(viewables = AllViewables) {
  const ret = {};
  viewables.forEach(prop => {
    const serdes = SerDes[prop];
    if (serdes) {
      ret[prop] = serdes.serialize(this[prop]);
    } else {
      ret[prop] = this[prop];
    }
  });
  return ret;
}

GameObject.prototype.deserialize = function deserialize(data) {
  Object.keys(data).forEach(prop => {
    const serdes = SerDes[prop];
    if (serdes) {
      this[prop] = serdes.deserialize(data[prop]);
    } else {
      this[prop] = data[prop];
    }
  });
}

export default GameObject;
