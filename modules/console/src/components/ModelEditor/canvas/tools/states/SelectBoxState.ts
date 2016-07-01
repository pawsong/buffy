import THREE from 'three';

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

abstract class SelectBoxState extends ToolState {
  private cursor: Cursor;

  private anchor1: THREE.Vector3;
  private anchorSize: THREE.Vector3;

  private anchor2: number;

  private normal: THREE.Vector3;
  private normalFilter: THREE.Vector3;

  private target: THREE.Vector3;
  private target2: number;

  private targetStep2: number;

  private handleHit: (params: CursorEventParams) => any;
  private handleMouseUp: (params: CursorEventParams) => any;

  private temp1: THREE.Vector3;
  private temp2: THREE.Vector3;
  private temp3: THREE.Vector3;
  private temp4: THREE.Vector3;

  private size: THREE.Vector3;

  private drawGuide: THREE.Mesh;

  constructor(private canvas: Canvas, private selectionBox: SelectionBox) {
    super();

    const drawGuideGeometry = new THREE.BoxGeometry(1, 1, 1);
    drawGuideGeometry.translate(1 / 2, 1 / 2, 1 / 2);
    this.drawGuide = new THREE.Mesh(drawGuideGeometry);

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
      onHit: params => this.handleHit(params),
      onMouseUp: params => this.handleMouseUp(params),
    });

    this.size = new THREE.Vector3();

    this.temp1 = new THREE.Vector3();
    this.temp2 = new THREE.Vector3();
    this.temp3 = new THREE.Vector3();
    this.temp4 = new THREE.Vector3();

    this.normal = new THREE.Vector3();
    this.normalFilter = new THREE.Vector3();

    this.anchor1 = new THREE.Vector3();
    this.anchorSize = new THREE.Vector3();

    this.anchor2 = 0;

    this.target = new THREE.Vector3();
    this.target2 = 0;
  }

  onEnter({ anchor, normal, size }: EnterParams) {
    document.addEventListener('keydown', this.handleKeyDown, false);

    this.size.set(size[0], size[1], size[2]);

    // Init handlers
    this.handleHit = this.handleHitInStep1;
    this.handleMouseUp = this.handleMouseUpInStep1;

    // Init data
    this.normal.copy(normal).round().multiply(this.normal); // Always positive.
    this.normalFilter.copy(this.normal).subScalar(1).multiplyScalar(-1);

    this.anchor1.copy(anchor);
    this.target.copy(this.anchor1);

    // Show and move draw guides
    const scaledAnchor = anchor.multiplyScalar(PIXEL_SCALE);

    this.drawGuide.position.copy(this.normal).multiply(scaledAnchor);
    this.drawGuide.scale
      .copy(this.normal).subScalar(1).multiplyScalar(-1)
      .multiply(this.temp1.copy(this.size).subScalar(1)).addScalar(1)
      .multiplyScalar(PIXEL_SCALE);
    this.drawGuide.updateMatrixWorld(false);

    // Init cursor mesh
    this.selectionBox.show(true);
    this.selectionBox.mesh.position.copy(scaledAnchor);
    this.selectionBox.resize(1, 1, 1);

    this.cursor.start();
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.keyCode === 27) {
      this.transitionTo(STATE_WAIT);
      this.canvas.render();
    }
  }

  /* Step 1: Get values for surface */

  handleHitInStep1 = ({ } : CursorEventParams) => {
    const position = this.cursor.getPosition();
    if (!position) return;

    if (this.target.equals(position)) return;
    this.target.copy(position);

    const displacement = position.sub(this.anchor1);

    this.selectionBox.mesh.position.set(
      this.anchor1.x + Math.min(displacement.x, 0),
      this.anchor1.y + Math.min(displacement.y, 0),
      this.anchor1.z + Math.min(displacement.z, 0)
    ).multiplyScalar(PIXEL_SCALE);

    this.selectionBox.resize(
      Math.abs(displacement.x) + 1,
      Math.abs(displacement.y) + 1,
      Math.abs(displacement.z) + 1
    );
  }

  handleMouseUpInStep1 = ({ } : CursorEventParams) => {
    const minX = Math.min(this.anchor1.x, this.target.x);
    const minY = Math.min(this.anchor1.y, this.target.y);
    const minZ = Math.min(this.anchor1.z, this.target.z);

    const width  = Math.max(this.anchor1.x, this.target.x) - minX;
    const height = Math.max(this.anchor1.y, this.target.y) - minY;
    const depth  = Math.max(this.anchor1.z, this.target.z) - minZ;

    this.anchor1.set(minX, minY, minZ);
    this.anchorSize.set(width + 1, height + 1, depth + 1);

    this.drawGuide.position
      .copy(this.anchor1)
      .multiply(this.normalFilter)
      .multiplyScalar(PIXEL_SCALE);

    this.drawGuide.scale
      .copy(this.anchorSize)
      .multiply(this.normalFilter)
      .add(this.temp1.copy(this.normal)
      .multiply(this.size))
      .multiplyScalar(PIXEL_SCALE);

    this.drawGuide.updateMatrixWorld(false);

    this.anchor2 = this.target2 = this.target.dot(this.normal);

    // Transition to Step 2
    this.handleHit = this.handleHitInStep2;
    this.handleMouseUp = this.handleMouseUpInStep2;
  }

  /* Step 2: Get value for normal direction */

  handleHitInStep2 = ({ } : CursorEventParams) => {
    const position = this.cursor.getPosition();
    if (!position) return;

    const target = position.dot(this.normal);

    if (this.target2 === target) return;
    this.target2 = target;

    this.selectionBox.mesh.position
      .multiply(this.normalFilter)
      .add(this.temp1.copy(this.normal).multiplyScalar(PIXEL_SCALE * Math.min(this.target2, this.anchor2)));

    const cursorSize = this.temp1.copy(this.anchorSize)
      .multiply(this.normalFilter)
      .add(this.temp2.copy(this.normal).multiplyScalar(Math.abs(this.target2 - this.anchor2) + 1));

    this.selectionBox.resize(cursorSize.x, cursorSize.y, cursorSize.z);
  }

  abstract onSelect(volumn: Volumn);

  handleMouseUpInStep2 = ({ } : CursorEventParams) => {
    const lo = this.temp1.copy(this.anchor1).multiply(this.normalFilter).add(
      this.temp2.copy(this.normal).multiplyScalar(Math.min(this.target2, this.anchor2))
    );

    const hi = this.temp3.copy(this.anchor1).add(this.anchorSize).subScalar(1).multiply(this.normalFilter).add(
      this.temp4.copy(this.normal).multiplyScalar(Math.max(this.target2, this.anchor2))
    );

    this.onSelect([lo.x, lo.y, lo.z, hi.x, hi.y, hi.z]);
    this.transitionTo(STATE_WAIT);
  }

  onLeave() {
    document.removeEventListener('keydown', this.handleKeyDown, false);

    this.cursor.stop();
    this.selectionBox.show(false);
  }
}

export default SelectBoxState;
