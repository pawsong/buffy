import ObjectManager from '../src/classes/ObjectManager';
import GameObject from '../src/classes/GameObject';

describe('ObjectManager', () => {
  it('ddd', () => {
    const manager = new ObjectManager(GameObject);
    const obj = manager.create({
      position: { x: 0, y: 0 },
    });
    obj.tween.to({ x: 1, y: 1 }).start(0);

    manager.on('start', (object) => {
      console.log('start');
      // console.log(object);
    });

    manager.on('move', (object, to, from) => {
      console.log('move');
      // console.log(object);
      console.log(to);
      console.log(from);
    });

    manager.on('stop', (object) => {
      console.log('stop');
      // console.log(object);
    });

    manager.update(300);
    manager.update(300);
    manager.update(300);
    manager.update(300);
  });
});
