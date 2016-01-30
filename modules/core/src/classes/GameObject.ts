import * as TWEEN from '@pasta/tween.js';
import Mesh from './Mesh';
import { SerializedMesh } from './Mesh';

export interface Position {
  x: number;
  z: number;
}

export interface SerializedGameObject {
  id: string;
  position: Position;
  mesh: SerializedMesh;
  tween?: Object;
}

class GameObject {
  id: string;
  position: Position;
  tween: TWEEN.Tween;
  mesh: Mesh;

  constructor(data: SerializedGameObject) {
    this.id = data.id;
    this.position = {
      x: data.position.x,
      z: data.position.z,
    };
    this.tween = new TWEEN.Tween(this.position);
    if (data.tween) {
      this.tween.deserialize(data.tween);
    }
    if (data.mesh) {
      this.mesh = new Mesh(data.mesh);
    }
  }

  serialize(): SerializedGameObject {
    return {
      id: this.id,
      position: {
        x: this.position.x,
        z: this.position.z,
      },
      mesh: this.mesh ? this.mesh.serialize() : null,
      tween: this.tween.serialize(),
    };
  }

  update(dt: number) {
    if (this.tween.isPlaying()) {
      if (false === this.tween.update2(dt)) {
        this.tween.stop();
      }
    }
  }
}

export default GameObject;
