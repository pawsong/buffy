export interface SerializedMesh {
  id: string;
  vertices: any[];
  faces: any[];
}

class Mesh {
  id: string;
  vertices: any[];
  faces: any[];

  constructor(data: SerializedMesh) {
    this.deserialize(data);
  }

  serialize(): SerializedMesh {
    return {
      id: this.id,
      vertices: this.vertices,
      faces: this.faces,
    };
  }

  deserialize(data: SerializedMesh) {
    this.id = data.id;
    this.vertices = data.vertices;
    this.faces = data.faces;
  }
}

export default Mesh;
