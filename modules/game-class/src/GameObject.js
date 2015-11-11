import TWEEN from '@pasta/tween.js';

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
  return this.manager.getAllObjects();
}

export default GameObject;
