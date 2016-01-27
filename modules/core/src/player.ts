import ctx from './context';

export default {
  move: (x, z) => {
    ctx.stateLayer.rpc.move({
      id: ctx.stateLayer.store.myId,
      x: x,
      z: z,
     });
  },

  boom: (duration = 2) => {
    const { position } = ctx.stateLayer.store.getPlayer();
    ctx.stateLayer.rpc.playEffect({
      x: position.x,
      z: position.z,
      duration,
    });
  }
};
