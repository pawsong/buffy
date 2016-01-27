'use strict';

import ServerGameMap from './classes/ServerGameMap';

const gameMaps: ServerGameMap[] = [];

export function add(map: ServerGameMap) {
  gameMaps.push(map);
}

export function find(mapId: string): ServerGameMap {
  return gameMaps[mapId];
}

// Update loop
// TODO: Static 20fps, is this OK?
let oldTime = Date.now();
function update() {
  const now = Date.now();
  const dt = now - oldTime;
  gameMaps.forEach(map => map.update(dt));
  oldTime = now;
  setTimeout(update, 1000 / 20);
}
update();
