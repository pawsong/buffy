import * as THREE from 'three';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';
import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  Position,
  ToolType,
  ModelEditorState,
} from '../../types';

import {
  voxelMaginWand,
  voxelClearSelection,
  voxelTransform,
  voxelMergeFragment,
} from '../../actions';

import {
  CurvedArrowGeometry,
  BidirectionalArrow,
} from '../objects/arrows';

const STATE_WAIT = ToolState.STATE_WAIT;

interface TransformToolProps {
  size: Position;
  maxSize: number;
  rotateArrowOffset: number;
  mirrorArrowOffset: number;
  selection: any;
  fragment: any;
}

interface TransformToolTree {
  size: Position;
}

const rotationTransforms = [
  [
    // X +90
    [
      [   1,   0,   0 ],
      [   0,   0,   1 ],
      [   0, - 1,   0 ],
    ],
    // X -90
    [
      [   1,   0,   0 ],
      [   0,   0, - 1 ],
      [   0,   1,   0 ],
    ],
  ],
  [
    // Y +90
    [
      [   0,   0, - 1 ],
      [   0,   1,   0 ],
      [   1,   0,   0 ],
    ],
    // Y -90
    [
      [   0,   0,   1 ],
      [   0,   1,   0 ],
      [ - 1,   0,   0 ],
    ],
  ],
  [
    // Z +90
    [
      [   0,   1,   0 ],
      [ - 1,   0,   0 ],
      [   0,   0,   1 ],
    ],
    // Z -90
    [
      [   0, - 1,   0 ],
      [   1,   0,   0 ],
      [   0,   0,   1 ],
    ],
  ],
];

const ARROW_HEAD_SIZE = PIXEL_SCALE / 4;
const ROTATE_ARROW_OFFSET = 0.8 * PIXEL_SCALE;
const MIRROW_ARROW_OFFSET = 0.8 * ROTATE_ARROW_OFFSET;

const BASE_COLOR_PROP = '__BASE_COLOR__';
const ACTIVE_COLOR_PROP = '__ACTIVE_COLOR__';

const TRANFORM_MATRIX_PROP = '__TRANSFORM_MATRIX__';

class TransformTool extends ModelEditorTool<TransformToolProps, void, TransformToolTree> {
  toolScene: THREE.Scene;
  private temp1: THREE.Vector3;

  rotationMaterials: THREE.MeshBasicMaterial[][];
  rotationMeshes: THREE.Mesh[][][];

  mirrorMaterials: THREE.MeshBasicMaterial[];

  private materialsToRestore: THREE.MeshBasicMaterial[];

  // 0: Z
  // 1: X
  // 2: Y (normal Z)
  // 3: Y (normal X)
  mirrorMeshes: BidirectionalArrow[];

  getToolType(): ToolType { return ToolType.TRANSFORM; }

  mapParamsToProps(params: ModelEditorState) {
    const { size } = params.file.present.data;
    const maxSize = Math.sqrt(Math.max(size[0], size[1], size[2]));
    return {
      size,
      maxSize,
      rotateArrowOffset: maxSize * ROTATE_ARROW_OFFSET,
      mirrorArrowOffset: maxSize * MIRROW_ARROW_OFFSET,
      selection: params.file.present.data.selection,
      fragment: params.file.present.data.fragment,
    };
  }

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        size: { type: SchemaType.ANY },
      },
    };
  }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
    };
  }

  render() {
    return {
      size: this.props.size,
    }
  }

  patch(diff: TransformToolTree) {
    if (diff.hasOwnProperty('size')) {
      const { size } = this.tree;
      const { maxSize, rotateArrowOffset } = this.props;

      for (let d = 0; d < 3; ++d) {
        const u = (d + 1) % 3;
        const v = (d + 2) % 3;

        const p0 = this.rotationMeshes[d][0][0];
        const n0 = this.rotationMeshes[d][0][1];
        const p1 = this.rotationMeshes[d][1][0];
        const n1 = this.rotationMeshes[d][1][1];
        const p2 = this.rotationMeshes[d][2][0];
        const n2 = this.rotationMeshes[d][2][1];
        const p3 = this.rotationMeshes[d][3][0];
        const n3 = this.rotationMeshes[d][3][1];

        p0.scale.set(maxSize, maxSize, maxSize);
        n0.scale.set(maxSize, maxSize, maxSize);
        p0.position.setComponent(u, - rotateArrowOffset);
        n0.position.setComponent(u, - rotateArrowOffset);
        p0.position.setComponent(v, - rotateArrowOffset);
        n0.position.setComponent(v, - rotateArrowOffset);

        p1.scale.set(maxSize, maxSize, maxSize);
        n1.scale.set(maxSize, maxSize, maxSize);
        p1.position.setComponent(u, size[u] * PIXEL_SCALE + rotateArrowOffset);
        n1.position.setComponent(u, size[u] * PIXEL_SCALE + rotateArrowOffset);
        p1.position.setComponent(v, - rotateArrowOffset);
        n1.position.setComponent(v, - rotateArrowOffset);

        p2.scale.set(maxSize, maxSize, maxSize);
        n2.scale.set(maxSize, maxSize, maxSize);
        p2.position.setComponent(u, size[u] * PIXEL_SCALE + rotateArrowOffset);
        n2.position.setComponent(u, size[u] * PIXEL_SCALE + rotateArrowOffset);
        p2.position.setComponent(v, size[v] * PIXEL_SCALE + rotateArrowOffset);
        n2.position.setComponent(v, size[v] * PIXEL_SCALE + rotateArrowOffset);

        p3.scale.set(maxSize, maxSize, maxSize);
        n3.scale.set(maxSize, maxSize, maxSize);
        p3.position.setComponent(u, - rotateArrowOffset);
        n3.position.setComponent(u, - rotateArrowOffset);
        p3.position.setComponent(v, size[v] * PIXEL_SCALE + rotateArrowOffset);
        n3.position.setComponent(v, size[v] * PIXEL_SCALE + rotateArrowOffset);
      }

      this.mirrorMeshes.forEach(arrow => arrow.scale.set(maxSize, maxSize, maxSize));
      this.mirrorMeshes[0].position.setZ(size[2] * PIXEL_SCALE / 2);
      this.mirrorMeshes[0].setLength(0.8 * size[2] * PIXEL_SCALE / maxSize);
      this.mirrorMeshes[1].position.setX(size[0] * PIXEL_SCALE / 2);
      this.mirrorMeshes[1].setLength(0.8 * size[0] * PIXEL_SCALE / maxSize);
      this.mirrorMeshes[2].position.setY(size[1] * PIXEL_SCALE / 2);
      this.mirrorMeshes[2].setLength(0.8 * size[1] * PIXEL_SCALE / maxSize);
      this.mirrorMeshes[3].position.setY(size[1] * PIXEL_SCALE / 2);
      this.mirrorMeshes[3].setLength(0.8 * size[1] * PIXEL_SCALE / maxSize);

      this.updateArrowMeshes();
    }
  }

  onInit(params: InitParams) {
    super.onInit(params);
    this.toolScene = new THREE.Scene();
    this.temp1 = new THREE.Vector3();

    this.materialsToRestore = [];

    this.mirrorMaterials = [
      this.createArrowMaterial(0xF44336, 0xD32F2F),
      this.createArrowMaterial(0x4CAF50, 0x388E3C),
      this.createArrowMaterial(0x2196F3, 0x1976D2),
    ];

    this.rotationMaterials = [
      [this.createArrowMaterial(0xF44336, 0xD32F2F), this.createArrowMaterial(0xF44336, 0xD32F2F)],
      [this.createArrowMaterial(0x4CAF50, 0x388E3C), this.createArrowMaterial(0x4CAF50, 0x388E3C)],
      [this.createArrowMaterial(0x2196F3, 0x1976D2), this.createArrowMaterial(0x2196F3, 0x1976D2)],
    ];

    // Rotation arrows

    const rotationGeometry = new CurvedArrowGeometry(PIXEL_SCALE * 3 / 2, ARROW_HEAD_SIZE);

    this.rotationMeshes = [];

    const rotation = new THREE.Vector3();

    for (let d = 0; d < 3; ++d) {
      const qs = [];
      for (let j = 0; j < 4; ++j) {
        const pair = [];
        for (let k = 0; k < 2; ++k) {
          const material = this.rotationMaterials[d][k];
          const mesh = new THREE.Mesh(rotationGeometry, material);
          this.toolScene.add(mesh);
          mesh[TRANFORM_MATRIX_PROP] = rotationTransforms[d][k];
          pair.push(mesh);
        }
        qs.push(pair);
      }
      this.rotationMeshes.push(qs);
    }

    this.rotationMeshes[0][0][0].rotation.set( - Math.PI / 2 , - Math.PI / 2 ,   0           );
    this.rotationMeshes[0][0][1].rotation.set( - Math.PI / 2 ,   Math.PI / 2 , - Math.PI / 2 );
    this.rotationMeshes[0][1][0].rotation.set(   0           , - Math.PI / 2 ,   0           );
    this.rotationMeshes[0][1][1].rotation.set(   Math.PI     ,   Math.PI / 2 ,   Math.PI / 2 );
    this.rotationMeshes[0][2][0].rotation.set(   Math.PI / 2 , - Math.PI / 2 ,   0           );
    this.rotationMeshes[0][2][1].rotation.set(   0           ,   Math.PI / 2 ,   0           );
    this.rotationMeshes[0][3][0].rotation.set(   Math.PI     , - Math.PI / 2 ,   0           );
    this.rotationMeshes[0][3][1].rotation.set(   Math.PI / 2 ,   Math.PI / 2 ,   0           );

    this.rotationMeshes[1][0][0].rotation.set(   Math.PI / 2 ,   0           ,   Math.PI / 2 );
    this.rotationMeshes[1][0][1].rotation.set( - Math.PI / 2 ,   0           ,   0           );
    this.rotationMeshes[1][1][0].rotation.set(   Math.PI / 2 ,   0           ,   0           );
    this.rotationMeshes[1][1][1].rotation.set(   Math.PI / 2 ,   Math.PI     , - Math.PI / 2 );
    this.rotationMeshes[1][2][0].rotation.set(   Math.PI / 2 ,   0           , - Math.PI / 2 );
    this.rotationMeshes[1][2][1].rotation.set(   Math.PI / 2 ,   Math.PI     ,   0           );
    this.rotationMeshes[1][3][0].rotation.set( - Math.PI / 2 ,   Math.PI     ,   0           );
    this.rotationMeshes[1][3][1].rotation.set(   Math.PI / 2 ,   Math.PI     ,   Math.PI / 2 );

    this.rotationMeshes[2][0][0].rotation.set(   0           ,   Math.PI     ,   Math.PI     );
    this.rotationMeshes[2][0][1].rotation.set(   0           ,   0           ,   Math.PI / 2 );
    this.rotationMeshes[2][1][0].rotation.set(   0           ,   Math.PI     ,   Math.PI / 2 );
    this.rotationMeshes[2][1][1].rotation.set(   0           ,   0           ,   Math.PI     );
    this.rotationMeshes[2][2][0].rotation.set( - Math.PI     ,   0           ,   Math.PI     );
    this.rotationMeshes[2][2][1].rotation.set(   0           ,   0           , - Math.PI / 2 );
    this.rotationMeshes[2][3][0].rotation.set(   0           ,   Math.PI     , - Math.PI / 2 );
    this.rotationMeshes[2][3][1].rotation.set(   0           ,   0           ,   0           );

    // Mirror arrows

    this.mirrorMeshes = [
      new BidirectionalArrow(this.mirrorMaterials[2], ARROW_HEAD_SIZE),
      new BidirectionalArrow(this.mirrorMaterials[0], ARROW_HEAD_SIZE),
      new BidirectionalArrow(this.mirrorMaterials[1], ARROW_HEAD_SIZE),
      new BidirectionalArrow(this.mirrorMaterials[1], ARROW_HEAD_SIZE),
    ];
    this.mirrorMeshes.forEach(arrow => this.toolScene.add(arrow));

    this.mirrorMeshes[0].rotation.set(Math.PI / 2 , Math.PI, Math.PI / 2);
    this.mirrorMeshes[0][TRANFORM_MATRIX_PROP] = [
      [   1 ,   0,   0 ],
      [   0 ,   1,   0 ],
      [   0 ,   0, - 1 ],
    ];
    this.mirrorMeshes[1].rotation.set(Math.PI / 2 , 0, 0);
    this.mirrorMeshes[1][TRANFORM_MATRIX_PROP] = [
      [ - 1 ,   0,   0 ],
      [   0 ,   1,   0 ],
      [   0 ,   0,   1 ],
    ];
    this.mirrorMeshes[2].rotation.set(0 , Math.PI, Math.PI / 2);
    this.mirrorMeshes[2][TRANFORM_MATRIX_PROP] = [
      [   1 ,   0,   0 ],
      [   0 , - 1,   0 ],
      [   0 ,   0,   1 ],
    ];
    this.mirrorMeshes[3].rotation.set(0 , Math.PI / 2, Math.PI / 2);
    this.mirrorMeshes[3][TRANFORM_MATRIX_PROP] = [
      [   1 ,   0,   0 ],
      [   0 , - 1,   0 ],
      [   0 ,   0,   1 ],
    ];
  }

  private createArrowMaterial(color: number, activeColor: number) {
    const material = new THREE.MeshBasicMaterial({ color });
    material[BASE_COLOR_PROP] = color;
    material[ACTIVE_COLOR_PROP] = activeColor;
    return material;
  }

  highlight(mesh: THREE.Mesh) {
    const material = <THREE.MeshBasicMaterial>mesh.material;
    this.materialsToRestore.push(material);
    material.color.setHex(material[ACTIVE_COLOR_PROP]);
  }

  resetHighlight() {
    if (this.materialsToRestore.length > 0) {
      this.materialsToRestore.forEach((material => {
        material.color.setHex(material[BASE_COLOR_PROP]);
      }));
      this.materialsToRestore = [];
    }
  }

  private updateArrowMeshes() {
    this.canvas.camera.getWorldDirection(this.temp1);
    const direction = [this.temp1.x, this.temp1.y, this.temp1.z];

    const { size, maxSize, mirrorArrowOffset } = this.props;

    if (direction[2] > 0) {
      this.mirrorMeshes[1].position.setZ(- mirrorArrowOffset);
    } else {
      this.mirrorMeshes[1].position.setZ(size[2] * PIXEL_SCALE + mirrorArrowOffset);
    }

    if (direction[0] > 0) {
      this.mirrorMeshes[0].position.setX(- mirrorArrowOffset);
    } else {
      this.mirrorMeshes[0].position.setX(size[0] * PIXEL_SCALE + mirrorArrowOffset);
    }

    if (direction[1] > 0) {
      this.mirrorMeshes[0].position.setY(size[1] * PIXEL_SCALE);
      this.mirrorMeshes[1].position.setY(size[1] * PIXEL_SCALE);
    } else {
      this.mirrorMeshes[0].position.setY(0);
      this.mirrorMeshes[1].position.setY(0);
    }

    const rad = Math.atan2(direction[0], direction[2]);
    if (rad > 0) {
      if (rad > Math.PI / 2) {
        if (rad > Math.PI * 3 / 4) {
          this.mirrorMeshes[2].visible = true;
          this.mirrorMeshes[3].visible = false;
          this.mirrorMeshes[2].position.setZ(0);
          this.mirrorMeshes[2].position.setX(- mirrorArrowOffset);
        } else {
          this.mirrorMeshes[2].visible = false;
          this.mirrorMeshes[3].visible = true;
          this.mirrorMeshes[3].position.setZ(size[2] * PIXEL_SCALE + mirrorArrowOffset);
          this.mirrorMeshes[3].position.setX(size[0] * PIXEL_SCALE);
        }
      } else {
        if (rad > Math.PI / 4) {
          this.mirrorMeshes[2].visible = false;
          this.mirrorMeshes[3].visible = true;
          this.mirrorMeshes[3].position.setZ(- mirrorArrowOffset);
          this.mirrorMeshes[3].position.setX(size[0] * PIXEL_SCALE);
        } else {
          this.mirrorMeshes[2].visible = true;
          this.mirrorMeshes[3].visible = false;
          this.mirrorMeshes[2].position.setZ(size[2] * PIXEL_SCALE);
          this.mirrorMeshes[2].position.setX(- mirrorArrowOffset);
        }
      }
    } else {
      if (rad <= - Math.PI / 2) {
        if (rad <= - Math.PI * 3 / 4) {
          this.mirrorMeshes[2].visible = true;
          this.mirrorMeshes[3].visible = false;
          this.mirrorMeshes[2].position.setZ(0);
          this.mirrorMeshes[2].position.setX(size[0] * PIXEL_SCALE + mirrorArrowOffset);
        } else {
          this.mirrorMeshes[2].visible = false;
          this.mirrorMeshes[3].visible = true;
          this.mirrorMeshes[3].position.setZ(size[2] * PIXEL_SCALE + mirrorArrowOffset);
          this.mirrorMeshes[3].position.setX(0);
        }
      } else {
        if (rad <= - Math.PI / 4) {
          this.mirrorMeshes[2].visible = false;
          this.mirrorMeshes[3].visible = true;
          this.mirrorMeshes[3].position.setZ(- mirrorArrowOffset);
          this.mirrorMeshes[3].position.setX(0);
        } else {
          this.mirrorMeshes[2].visible = true;
          this.mirrorMeshes[3].visible = false;
          this.mirrorMeshes[2].position.setZ(size[2] * PIXEL_SCALE);
          this.mirrorMeshes[2].position.setX(size[0] * PIXEL_SCALE + mirrorArrowOffset);
        }
      }
    }

    for (let d = 0; d < 3; ++d) {
      const u = (d + 1) % 3;
      const v = (d + 2) % 3;

      for (let j = 0; j < 4; ++j) {
        this.rotationMeshes[d][j][0].visible = false;
        this.rotationMeshes[d][j][1].visible = false;
      }

      const p = direction[d] > 0 ? this.props.size[d] * PIXEL_SCALE : 0;

      let q;

      if (direction[u] > 0 && direction[v] > 0) {
        q = 0;
      } else if (direction[u] <= 0 && direction[v] > 0) {
        q = 1;
      } else if (direction[u] <= 0 && direction[v] <= 0) {
        q = 2;
      } else {
        q = 3;
      }

      const pm = this.rotationMeshes[d][q][0];
      const nm = this.rotationMeshes[d][q][1];
      pm.visible = true;
      nm.visible = true;
      pm.position.setComponent(d, p);
      nm.position.setComponent(d, p);
    }
  }

  onStart() {
    this.updateArrowMeshes();
  }

  onCameraMove() {
    this.updateArrowMeshes();
  }

  onRender() {
    super.onRender();
    this.canvas.renderer.clearDepth();
    this.canvas.renderer.render(this.toolScene, this.canvas.camera);
  }

  onDestroy() {

  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: TransformTool) {
    super();

    const arrowMeshes: THREE.Object3D[] = [];
    for (let i = 0; i < 3; ++i) {
      for (let j = 0; j < 4; ++j) {
        for (let k = 0; k < 2; ++k) {
          arrowMeshes.push(tool.rotationMeshes[i][j][k]);
        }
      }
    }
    tool.mirrorMeshes.forEach(mesh => arrowMeshes.push(mesh));

    this.cursor = new Cursor(tool.canvas, {
      visible: false,
      intersectRecursively: true,
      getInteractables: () => arrowMeshes,
      onHit: this.handleHit,
      onMiss: this.handleMiss,
      onMouseDown: this.handleMouseDown,
      onMouseUp: this.handleMouseUp,
    });
  }

  onEnter() {
    this.cursor.start();
  }

  private handleHit = ({ intersect }: CursorEventParams) => {
    this.tool.resetHighlight();

    if (intersect.object.children.length > 0) {
      intersect.object.children.forEach(child => {
        this.tool.highlight(<THREE.Mesh>child);
      });
    } else {
      this.tool.highlight(<THREE.Mesh>intersect.object);
    }
  }

  private handleMiss = () => {
    this.tool.resetHighlight();
  }

  private handleMouseUp = ({ intersect }: CursorEventParams) => {
    if (!intersect) return;

    const arrow = intersect.object.parent ===  this.tool.toolScene ? intersect.object : intersect.object.parent;
    this.tool.dispatchAction(voxelTransform(arrow[TRANFORM_MATRIX_PROP]));
  }

  handleMouseDown = () => {
    if (this.tool.props.fragment) {
      this.tool.dispatchAction(voxelMergeFragment());
    }
  }

  onLeave() {
    this.cursor.stop();
  }
}

export default TransformTool;
