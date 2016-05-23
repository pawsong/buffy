import * as THREE from 'three';
const invariant = require('fbjs/lib/invariant');
import { Mesh } from '@pasta/core/lib/types';
import * as Immutable from 'immutable';

import {
  PIXEL_SCALE,
  DESIGN_SCALE,
} from '../Constants';

import { createGeometryFromMesh } from '../utils';

enum LoaderState {
  INIT,
  LOADING,
  LOADED,
}

export interface LoaderWatcher {
  (geometry: THREE.Geometry): any;
}

class ModelLoader {
  state: LoaderState;
  watchers: LoaderWatcher[];
  xhr: XMLHttpRequest;
  garbageCollectionEnabled: boolean;

  // Data
  geometry: THREE.Geometry;
  thumbnail: string;

  private modelId: string;
  private modelManager: ModelManager;

  constructor(modelManager: ModelManager, modelId: string) {
    this.modelManager = modelManager;
    this.modelId = modelId;

    this.state = LoaderState.INIT;
    this.watchers = [];
    this.xhr = null;
    this.garbageCollectionEnabled = true;

    this.thumbnail = ''; // TODO: Add default thumbnail.
  }

  preventGarbageCollection() {
    this.garbageCollectionEnabled = false;
  }

  addWatcher(watcher: LoaderWatcher) {
    this.watchers.push(watcher);
    if (this.state === LoaderState.LOADED) watcher(this.geometry);
  }

  removeWatcher(watcher: LoaderWatcher) {
    const index = this.watchers.indexOf(watcher);
    if (index !== -1) this.watchers.splice(index, 1);
  }

  watcherExists() {
    return this.watchers.length !== 0;
  }

  isReadyToDispose() {
    return this.garbageCollectionEnabled && !this.watcherExists();
  }

  dispose() {
    this.modelManager.removeThumbnail(this.modelId);

    this.watchers = [];

    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }

    this.thumbnail = '';
  }

  triggerWatchers() {
    this.watchers.forEach(watcher => watcher(this.geometry));
  }

  loadFromRemote(modelId: string) {
    this.state = LoaderState.LOADING;

    if (this.xhr) this.xhr.abort();

    this.xhr = new XMLHttpRequest();
    this.xhr.open("GET", "/myfile.png", true);
    this.xhr.responseType = 'arraybuffer';

    this.xhr.onload = e => {
      const arrayBuffer = this.xhr.response;

      // Decode response...
      if (this.geometry) this.geometry.dispose();
      this.geometry = createGeometryFromMesh(null);

      this.state = LoaderState.LOADED;
      this.triggerWatchers();

      this.modelManager.notifyUpdate();
    };
    this.xhr.send();
  }

  loadFromMemory(mesh: Mesh) {
    if (this.xhr) {
      this.xhr.abort();
      this.xhr = null;
    }

    if (this.geometry) this.geometry.dispose();
    this.geometry = createGeometryFromMesh(mesh);
    this.geometry.scale(DESIGN_SCALE, DESIGN_SCALE, DESIGN_SCALE);

    this.state = LoaderState.LOADED;
    this.triggerWatchers();

    const thumbnailUrl = this.modelManager.createThumbnail(this.geometry);

    this.modelManager.updateThumbnail(this.modelId, thumbnailUrl);
    this.modelManager.notifyUpdate();
  }
}

const THUMBNAIL_SIZE = 256;
const radius = 160, theta = 270, phi = 60;

class ModelManager {
  loaders: { [index: string]: ModelLoader };
  thumbnails: Immutable.Map<string, string>;

  private thumbnailListeners: (() => any)[];
  private updateListeners: (() => any)[];

  private renderer: THREE.WebGLRenderer;
  private thumbnailMaterial: THREE.Material;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private thumbnailBoundingBoxSize: THREE.Vector3;

  constructor() {
    this.updateListeners = [];

    this.loaders = {};
    this.thumbnails = Immutable.Map<string, string>();
    this.thumbnailListeners = [];
    this.thumbnailBoundingBoxSize = new THREE.Vector3();

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
    light.position.set(5, 3, 4);
    light.position.normalize();
    this.scene.add(light);
  }

  notifyUpdate() {
    this.updateListeners.forEach(listener => listener());
  }

  listenUpdate(listener: () => any) {
    this.updateListeners.push(listener);
  }

  unlistenUpdate(listener: () => any) {
    const index = this.updateListeners.indexOf(listener);
    if (index !== -1) this.updateListeners.splice(index, 1);
  }

  createThumbnail(geometry: THREE.Geometry): string {
    const mesh = new THREE.Mesh(geometry, this.thumbnailMaterial);
    geometry.boundingBox.size(this.thumbnailBoundingBoxSize);
    mesh.position.set(
      -geometry.boundingBox.min.x - this.thumbnailBoundingBoxSize.x / 2,
      -geometry.boundingBox.min.y - this.thumbnailBoundingBoxSize.y / 2,
      -geometry.boundingBox.min.z - this.thumbnailBoundingBoxSize.z / 2
    );

    this.scene.add(mesh);
    this.renderer.render(this.scene, this.camera);
    const thumbnailUrl = this.renderer.domElement.toDataURL();
    this.scene.remove(mesh);

    return thumbnailUrl;
  }

  subscribeThumbnails(listener: () => any) {
    this.thumbnailListeners.push(listener);
    listener();
  }

  unsubscribeThumbnails(listener: () => any) {
    const index = this.thumbnailListeners.indexOf(listener);
    if (index !== -1) this.thumbnailListeners.splice(index, 1);
  }

  updateThumbnail(modelId: string, thumbnail: string) {
    this.thumbnails = this.thumbnails.set(modelId, thumbnail);
    this.notifyThumbnailsChange();
  }

  removeThumbnail(modelId: string) {
    this.thumbnails = this.thumbnails.remove(modelId);
    this.notifyThumbnailsChange();
  }

  private notifyThumbnailsChange() {
    this.thumbnailListeners.forEach(listener => listener());
  }

  getLoader(modelId: string) {
    return this.loaders[modelId];
  }

  getOrCreateLoader(modelId: string) {
    const loader = this.getLoader(modelId);
    if (loader) return loader;
    return this.loaders[modelId] = new ModelLoader(this, modelId);
  }

  watch(modelId: string, watcher: LoaderWatcher) {
    let loader = this.loaders[modelId];
    if (!loader) {
      loader = this.loaders[modelId] = new ModelLoader(this, modelId);
    }

    loader.addWatcher(watcher);

    if (loader.state === LoaderState.INIT) loader.loadFromRemote(modelId);
  }

  unwatch(modelId: string, watcher: LoaderWatcher) {
    const loader = this.loaders[modelId];
    invariant(loader, `Cannot find loader for ${modelId}`);

    loader.removeWatcher(watcher);

    if (loader.isReadyToDispose()) {
      loader.dispose();
      delete this.loaders[modelId];
    }
  }

  dispose() {
    Object.keys(this.loaders).forEach(modelId => {
      const loader = this.loaders[modelId];
      // invariant(!loader.watcherExists(), `loader ${modelId} has watchers on dispose`);
      loader.dispose();
    });
    this.loaders = {};
  }
}

export default ModelManager;
