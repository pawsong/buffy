const { id, stateLayer } = self.$pasta;

export default {
  move: (x, y) => {
    stateLayer.rpc.move({
      id: '',
      x,
      y,
     });
  },

  boom: (duration = 2) => {
    const { position } = stateLayer.store.getPlayer();
    stateLayer.rpc.playEffect({
      x: position.x,
      y: position.y,
      duration,
    });
  }
};
