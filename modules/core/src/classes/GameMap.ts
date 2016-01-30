import Terrain from './Terrain';
import { SerializedTerrain } from './Terrain';
import GameObject from './GameObject';
import { SerializedGameObject } from './GameObject';

function findIndex<T>(array: T[], check: (T) => Boolean): number {
  const len = array.length;
  for (let i = 0; i < len; ++i) {
    if (check(array[i])) { return i; }
  }
  return -1;
}

function find<T>(array: T[], check: (T) => Boolean): T {
  const index = findIndex(array, check);
  if (index === -1) { return; }
  return array[index];
}

export interface SerializedGameMap {
  id: string;
  name: string;
  width: number;
  depth: number;
  terrains: SerializedTerrain[],
  objects: SerializedGameObject[],
}

class GameMap {
  id: string;
  name: string;
  width: number;
  depth: number;

  terrains: Terrain[];
  objects: GameObject[];

  constructor(data: SerializedGameMap) {
    this.id = data.id;
    this.name = data.name;
    this.width = data.width;
    this.depth = data.depth;

    this.terrains = [];
    data.terrains.forEach(serialized => {
      const terrain = new Terrain(serialized);
      this.terrains.push(terrain);
    });

    this.objects = [];
    data.objects.forEach(serialized => {
      const obj = new GameObject(serialized);
      this.objects.push(obj);
    });
  }

  serialize(): SerializedGameMap {
    return {
      id: this.id,
      name: this.name,
      width: this.width,
      depth: this.depth,
      terrains: this.terrains.map(terrain => terrain.serialize()),
      objects: this.objects.map(obj => obj.serialize()),
    };
  }

  update(dt: number) {
    this.objects.forEach(object => object.update(dt));
  }

  addObject(object: GameObject) {
    if(findIndex(this.objects, obj => obj.id === object.id) !== -1) {
      throw new Error(`Duplicate object id ${object.id}`);
    }
    this.objects.push(object);
  }

  removeObject(object: GameObject) {
    const idx = findIndex(this.objects, obj => obj.id === object.id);
    if (idx !== -1) {
      this.objects.splice(idx, 1);
    }
  }

  findObject(id: string) {
    return find(this.objects, obj => obj.id === id);
  }

  getAllObjects() {
    return this.objects;
  }

  updateTerrain(data: SerializedTerrain): Terrain {
    let terrain = find(this.terrains, terrain => terrain.id === data.id);
    if (terrain) {
      terrain.color = data.color;
    } else {
      terrain = new Terrain(data);
      this.terrains.push(terrain);
    }
    return terrain;
  }
}

export default GameMap;
