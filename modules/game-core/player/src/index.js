const $pasta = self.$pasta;

export default {
  move: (x, y) => {
    $pasta.api.move($pasta.id, x, y);
  },
};
