import * as THREE from 'three';

import { Schema, SchemaType } from '@pasta/helper/lib/diff';

import { ToolState } from '../../../../../libs/Tool';
import Cursor, { CursorEventParams } from '../../../../../canvas/Cursor';
import Canvas from '../../../../../canvas/Canvas';

import {
  Volumn,
  Position,
} from '../../../types';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../canvas/Constants';

import SelectionBox from '../../objects/SelectionBox';

const STATE_WAIT = ToolState.STATE_WAIT;

export interface EnterParams {
  size: Position;
  anchor: THREE.Vector3;
  normal: THREE.Vector3;
}

abstract class SelectRectangleState extends ToolState {
  private cursor: Cursor;
  private anchor: THREE.Vector3;
  private target: THREE.Vector3;
  private temp1: THREE.Vector3;

  private drawGuide: THREE.Mesh;

  constructor(private canvas: Canvas, private selectionBox: SelectionBox) {
    super();

    this.temp1 = new THREE.Vector3();

    // Setup draw guides

    const drawGuideGeometry = new THREE.BoxGeometry(1, 1, 1);
    drawGuideGeometry.translate(1 / 2, 1 / 2, 1 / 2);

    const drawGuideMaterial = new THREE.MeshBasicMaterial();

    this.drawGuide = new THREE.Mesh(drawGuideGeometry, drawGuideMaterial);

    // Debug
    // drawGuideMaterial.color.setHex(0x000fff);
    // drawGuideMaterial.opacity = 0.5;
    // drawGuideMaterial.transparent = true;
    // tool.canvas.scene.add(this.drawGuide);

    // Setup cursor

    const offset = new THREE.Vector3();
    const intersectables = [this.drawGuide];

    this.cursor = new Cursor(canvas, {
      visible: false,
      getInteractables: () => intersectables,
      getOffset: intersect => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * intersect.face.normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * intersect.face.normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * intersect.face.normal.z)
      ),
      onMouseUp: params => this.handleMouseUp(params),
      onHit: params => this.handleHit(params),
    });

    this.anchor = new THREE.Vector3();
    this.target = new THREE.Vector3();
  }

  onEnter({ anchor, normal, size }: EnterParams) {
    // Init data

    this.anchor.copy(anchor);
    this.target.copy(this.anchor);

    // Show and move draw guides

    const scaledAnchor = anchor.multiplyScalar(PIXEL_SCALE);
    const absNormal = this.temp1.copy(normal).multiply(normal);

    this.drawGuide.position.copy(absNormal).multiply(scaledAnchor);
    this.drawGuide.scale
      .copy(absNormal).subScalar(1).multiplyScalar(-1)
      .multiply(this.temp1.set(size[0] - 1, size[1] - 1, size[2] - 1))
      .addScalar(1)
      .multiplyScalar(PIXEL_SCALE);
    this.drawGuide.updateMatrixWorld(false);

    // Init cursor mesh

    this.selectionBox.show(true);
    this.selectionBox.mesh.position.copy(scaledAnchor);
    this.selectionBox.resize(1, 1, 1);

    this.cursor.start();
  }

  onLeave() {
    this.cursor.stop();
    this.selectionBox.show(false);
  }

  handleHit({ } : CursorEventParams) {
    const position = this.cursor.getPosition();
    if (!position) return;

    if (this.target.equals(position)) return;
    this.target.copy(position);

    const displacement = position.sub(this.anchor);

    this.selectionBox.mesh.position.set(
      this.anchor.x + Math.min(displacement.x, 0),
      this.anchor.y + Math.min(displacement.y, 0),
      this.anchor.z + Math.min(displacement.z, 0)
    ).multiplyScalar(PIXEL_SCALE);

    this.selectionBox.resize(
      Math.abs(displacement.x) + 1,
      Math.abs(displacement.y) + 1,
      Math.abs(displacement.z) + 1
    );
  }

  abstract onSelect(volumn: Volumn);

  handleMouseUp({ } : CursorEventParams) {
    this.onSelect([
      Math.min(this.anchor.x, this.target.x),
      Math.min(this.anchor.y, this.target.y),
      Math.min(this.anchor.z, this.target.z),
      Math.max(this.anchor.x, this.target.x),
      Math.max(this.anchor.y, this.target.y),
      Math.max(this.anchor.z, this.target.z),
    ]);
    this.transitionTo(STATE_WAIT);
  }
}

export default SelectRectangleState;
