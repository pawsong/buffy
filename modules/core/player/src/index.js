const $pasta = self.$pasta;

export default {
  move: (x, y) => {
    $pasta.adapter.move($pasta.id, x, y);
  },
};
