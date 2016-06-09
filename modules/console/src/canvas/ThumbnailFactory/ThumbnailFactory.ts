import * as THREE from 'three';
const invariant = require('fbjs/lib/invariant');
import { Mesh } from '@pasta/core/lib/types';
import * as Immutable from 'immutable';
import * as ndarray from 'ndarray';

import GeometryFactory from '../GeometryFactory';

import {
  PIXEL_SCALE,
  DESIGN_SCALE,
} from '../Constants';

const THUMBNAIL_SIZE = 256;
const radius = 160, theta = 135, phi = 30;

class ThumbnailFactory {
  private renderer: THREE.WebGLRenderer;
  private thumbnailMaterial: THREE.Material;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private temp1: THREE.Vector3;

  private cache: WeakMap<ndarray.Ndarray, string>; //  Immutable.Map<ndarray.Ndarray, string>;
  private emptyThumbnail: string;

  constructor(private geometryFactory: GeometryFactory) {
    this.cache = new WeakMap<ndarray.Ndarray, string>();
    this.temp1 = new THREE.Vector3();

    // Setup environment for creating thumbanil.
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    this.renderer.setClearColor(0xffffff);

    this.thumbnailMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
    });

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      40, THUMBNAIL_SIZE / THUMBNAIL_SIZE, 1, 10000
    );
    this.camera.position.x = radius * Math.cos(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360);
    this.camera.position.z = radius * Math.sin(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360);
    this.camera.position.y = radius * Math.sin(phi * Math.PI / 360);
    this.camera.lookAt(this.scene.position);
    this.scene.add(this.camera);

    const ambientLight = new THREE.AmbientLight(0x666666);
    this.scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.copy(this.camera.position);
    light.lookAt(this.scene.position);

    this.scene.add(light);

    this.emptyThumbnail = this.renderer.domElement.toDataURL();
  }

  createThumbnail(data: ndarray.Ndarray): string {
    const cached = this.cache.get(data);
    if (cached) return cached;

    const geometry = this.geometryFactory.getGeometry(data);

    geometry.boundingBox.size(this.temp1);
    const scale = 64 / Math.max(this.temp1.x, this.temp1.y, this.temp1.z);

    const object = new THREE.Mesh(geometry, this.thumbnailMaterial);
    object.position.set(
      -geometry.boundingBox.min.x - this.temp1.x / 2,
      -geometry.boundingBox.min.y - this.temp1.y / 2,
      -geometry.boundingBox.min.z - this.temp1.z / 2
    ).multiplyScalar(scale);

    // Normalize size
    object.scale.set(scale, scale, scale);

    this.scene.add(object);
    this.renderer.render(this.scene, this.camera);

    const thumbnailUrl = this.renderer.domElement.toDataURL();

    this.scene.remove(object);

    // Do not dispose geometry here. It will be disposed in where it was generated.
    // geometry.dispose();

    this.cache.set(data, thumbnailUrl);
    return thumbnailUrl;
  }
}

export default ThumbnailFactory;
