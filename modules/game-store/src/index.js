import EventEmitter from 'eventemitter3';
import ObjectManager from './ObjectManager';

function createGameStore() {
  const EE = new EventEmitter();

  // Stop running.
  function destroy() {
  }

  const objs = {};

  // Setter functions.
  // Setter must be called by network event listener or store's update function.
  function onMove(objId, x, y) {
    const obj = objs[objId];
    const oldX = obj.x;
    const oldY = obj.y;
    obj.x = x;
    obj.y = y;

    EE.emit('objMove', obj, x, y, oldX, oldY);
  }

  function getNearestObject(objId) {
  }

  function getNearObjects(objId, radius = 100) {
    const ret = [];
    objs.forEach(obj => {
      ret.push(obj);
    });
    return ret;
  }

  function update() {
  }

  // Getter. Only getter should be exposed to user script.
  const accessors = {
    getNearestObject,
    getNearObjects,
  };

  return {
    run,
    destroy,
    accessors,
  };
}

export default {
  createGameStore,
};
