import * as _ from 'lodash';
import Terrain from './Terrain';
import { SerializedTerrain } from './Terrain';
import GameObject from './GameObject';
import { SerializedGameObject } from './GameObject';

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
    if(_.findIndex(this.objects, obj => obj.id === object.id) !== -1) {
      throw new Error(`Duplicate object id ${object.id}`);
    }
    this.objects.push(object);
  }

  removeObject(object: GameObject) {
    const idx = _.findIndex(this.objects, { id: object.id });
    if (idx !== -1) {
      this.objects.splice(idx, 1);
    }
  }

  findObject(id: string) {
    return _.find(this.objects, { id });
  }

  getAllObjects() {
    return this.objects;
  }

  updateTerrain(data: SerializedTerrain): Terrain {
    let terrain = _.find(this.terrains, { id: data.id });
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
