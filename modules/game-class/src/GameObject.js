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

  type: null,

  options: null,

  tween: {
    serialize: function (value) {
      return value.toJSON();
    },

    deserialize: function (value) {
      this.restore(value);
    },
  },
};

const AllViewables = Object.keys(SerDes);

/*
 * Constructor
 */
function GameObject(manager, options) {
  this.id = options.id;
  this.position = options.position;
  this.type = options.type;
  this.options = options;

  this.tween = new TWEEN.Tween(this.position);
  this.manager = manager;

  if (options.tween) {
    this.tween.import(options.tween);
  }
}

GameObject.prototype.update = function update(dt) {
  if (this.tween.isPlaying()) {
    if (false === this.tween.update2(dt)) {
      this.tween.stop();
    }
  }
}

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
