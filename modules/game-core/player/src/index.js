const { api, store } = self.$pasta;

export default {
  move: (x, y) => {
    api.move($pasta.id, x, y);
  },

  boom: (x, y) => {
    api.playEffect(x, y);
  }
};
