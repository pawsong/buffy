function makeCache() {
  const store = {};
  const factories = {};

  return {
    set: function (key, factory) {
      factories[key] = factory;
    },

    get: function (key) {
      if (store[key]) { return store[key] };
      if (!factories[key]) { return null; };

      store[key] = factories[key]();
      return store[key];
    },
  };
}

module.exports = makeCache;
