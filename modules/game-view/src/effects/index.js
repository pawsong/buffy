import {
  createExplosion,
} from './explosion';

export function createEffectManager(scene) {
  const effects = [];

  function update(dt) {
    effects.forEach((effect, index) => {
      if (false === effect.update(dt)) {
        effects.splice(index, 1);
      }
    });
  }

  function create(type, maxAge, position) {
    const effect = createExplosion(scene, maxAge, position);
    effects.push(effect);
  }

  return { create, update };
}
