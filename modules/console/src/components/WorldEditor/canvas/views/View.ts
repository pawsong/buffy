import THREE from 'three';

export interface Position {
  x: number; y: number; z: number;
}

interface View {
  camera: THREE.Camera;
  addPosition(pos: Position): void;
  setPosition(pos: Position): void;
  onUpdate(): void;
  onResize(): void;
  onEnter(): void;
  onLeave(): void;
  onDispose(): void;
}

export default View;
