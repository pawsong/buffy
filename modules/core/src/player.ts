import Ctx from './Context';
const { stateLayer } = Ctx;

export default {
  move: (x, z) => {
    stateLayer.rpc.move({
      id: stateLayer.store.myId,
      x: x,
      z: z,
     });
  },

  boom: (duration = 2) => {
    const { position } = stateLayer.store.getPlayer();
    stateLayer.rpc.playEffect({
      x: position.x,
      z: position.z,
      duration,
    });
  }
};
