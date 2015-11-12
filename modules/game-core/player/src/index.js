const { id, api, store } = self.$pasta;

export default {
  move: (x, y) => {
    api.move(id, x, y);
  },

  boom: (duration = 2) => {
    const { position } = store.getPlayer();
    api.playEffect(position.x, position.y, duration);
  }
};
