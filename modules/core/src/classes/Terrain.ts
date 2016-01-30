export interface Position {
  x: number;
  z: number;
}

export interface SerializedTerrain {
  id: string;
  position: Position;
  color: number;
}

class Terrain {
  id: string;
  position: Position;
  color: number;

  constructor(data: SerializedTerrain) {
    this.id = data.id;
    this.position = {
      x: data.position.x,
      z: data.position.z,
    };
    this.color = data.color;
  }

  serialize(): SerializedTerrain {
    return {
      id: this.id,
      position: {
        x: this.position.x,
        z: this.position.z,
      },
      color: this.color,
    };
  }
}

export default Terrain;
