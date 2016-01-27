import * as TWEEN from '@pasta/tween.js';

export interface Position {
  x: number;
  z: number;
}

export interface Mesh {
  vertices: any[];
  faces: any[];
}

export interface SerializedGameObject {
  id: string;
  position: Position;
  mesh: Mesh;
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
      this.mesh = data.mesh;
    }
  }

  serialize(): SerializedGameObject {
    return {
      id: this.id,
      position: {
        x: this.position.x,
        z: this.position.z,
      },
      mesh: this.mesh || null,
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
