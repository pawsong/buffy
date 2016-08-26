import * as THREE from 'three';
import Promise from 'bluebird';
const invariant = require('fbjs/lib/invariant');
import { Mesh } from '@pasta/core/lib/types';
import * as Immutable from 'immutable';
import * as ndarray from 'ndarray';

import GeometryFactory from '../GeometryFactory';
import TroveGeometryFactory from '../TroveGeometryFactory';
import { VoxelData, MaterialMaps } from '../../components/ModelEditor/types';
import getTroveMaterial from '../../components/ModelEditor/canvas/materials/getTroveMaterial';
import { ModelFileType, MaterialMapType } from '../../types';

import {
  PIXEL_SCALE,
  DESIGN_SCALE,
} from '../Constants';

const THUMBNAIL_SIZE = 256;
const radius = 160, theta = 135, phi = 30;

class ThumbnailFactory {
  private renderer: THREE.WebGLRenderer;
  private blobRenderer: THREE.WebGLRenderer;
  private waitingBlobRequests: Set<ndarray.Ndarray>;

  private thumbnailMaterial: THREE.Material;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private temp1: THREE.Vector3;

  private cache: WeakMap<MaterialMaps, string>;
  private jpegCache: WeakMap<MaterialMaps, Blob>;

  private emptyThumbnail: string;

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    renderer.setClearColor(0xffffff);
    return renderer;
  }

  constructor(private geometryFactory: GeometryFactory, private troveGeometryFactory: TroveGeometryFactory) {
    // Install canvas.toBlob polyfill
    if (!HTMLCanvasElement.prototype.toBlob) require('blueimp-canvas-to-blob');

    this.cache = new WeakMap<MaterialMaps, string>();
    this.jpegCache = new WeakMap<MaterialMaps, Blob>();
    this.waitingBlobRequests = new Set<ndarray.Ndarray>();

    this.temp1 = new THREE.Vector3();

    // Setup environment for creating thumbanil.
    this.renderer = this.createRenderer();
    this.blobRenderer = this.createRenderer();

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

    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.copy(this.camera.position);
    light.lookAt(this.scene.position);

    this.scene.add(light);

    this.emptyThumbnail = this.renderer.domElement.toDataURL();
  }

  private render(data: VoxelData, renderer: THREE.WebGLRenderer) {
    let geometry: THREE.Geometry;
    let material: THREE.Material;

    switch (data.type) {
      case ModelFileType.DEFAULT: {
        geometry = this.geometryFactory.getGeometry(data.maps[MaterialMapType.DEFAULT]);
        material = this.thumbnailMaterial;
        break;
      }
      case ModelFileType.TROVE: {
        geometry = this.troveGeometryFactory.getGeometry(
          data.maps[MaterialMapType.DEFAULT],
          data.maps[MaterialMapType.TROVE_TYPE],
          data.maps[MaterialMapType.TROVE_ALPHA],
          data.maps[MaterialMapType.TROVE_SPECULAR]
        );
        material = getTroveMaterial(false);
        break;
      }
    }

    if (!geometry || geometry.vertices.length === 0) {
      renderer.render(this.scene, this.camera);
      return;
    }

    geometry.boundingBox.size(this.temp1);
    const scale = 64 / Math.max(this.temp1.x, this.temp1.y, this.temp1.z);

    const object = new THREE.Mesh(geometry, material);
    object.position.set(
      -geometry.boundingBox.min.x - this.temp1.x / 2,
      -geometry.boundingBox.min.y - this.temp1.y / 2,
      -geometry.boundingBox.min.z - this.temp1.z / 2
    ).multiplyScalar(scale);

    // Normalize size
    object.scale.set(scale, scale, scale);

    this.scene.add(object);
    renderer.render(this.scene, this.camera);
    this.scene.remove(object);

    // Do not dispose geometry here. It will be disposed in where it was generated.
    // geometry.dispose();
  }

  createThumbnail(data: VoxelData): string {
    const cached = this.cache.get(data.maps);
    if (cached) return cached;

    this.render(data, this.renderer);
    const thumbnailUrl = this.renderer.domElement.toDataURL();

    this.cache.set(data.maps, thumbnailUrl);
    return thumbnailUrl;
  }

  private pendingPromise: Promise<Blob>;

  private _createThumbnailBlob(data: VoxelData, callback: (blob: Blob) => any) {
    this.render(data, this.blobRenderer);
    const canvas: any = this.blobRenderer.domElement;
    canvas.toBlob(blob => {
      this.jpegCache.set(data.maps, blob);
      callback(blob);
    }, 'image/jpeg', 0.95);
  }

  createThumbnailBlob = (data: VoxelData): Promise<Blob> => {
    const cached = this.jpegCache.get(data.maps);
    if (cached) return Promise.resolve(cached);

    if (!this.pendingPromise || !this.pendingPromise.isPending()) {
      return this.pendingPromise = new Promise<Blob>(resolve => {
        this._createThumbnailBlob(data, resolve);
      });
    } else {
      return this.pendingPromise = this.pendingPromise.then(() => new Promise<Blob>(resolve => {
        this._createThumbnailBlob(data, resolve);
      }));
    }
  }

  dispose() {
    // Check for ie and edge, which do not support WEBGL_lose_context.
    const supportLoseContext = !!this.renderer.extensions.get('WEBGL_lose_context');
    if (supportLoseContext) {
      this.renderer.forceContextLoss();
      this.blobRenderer.forceContextLoss();
    }

    this.renderer.context = null;
    this.renderer.domElement = null;
    this.blobRenderer.context = null;
    this.blobRenderer.domElement = null;
  }
}

export default ThumbnailFactory;
