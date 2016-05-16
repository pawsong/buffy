import * as THREE from 'three';
const invariant = require('fbjs/lib/invariant');
import { Mesh } from '@pasta/core/lib/types';

import { createGeometryFromMesh } from '../utils';

enum LoaderState {
  INIT,
  LOADING,
  LOADED,
}

export interface LoaderWatcher {
  (geometry: THREE.Geometry): any;
}

class DesignLoader {
  state: LoaderState;
  watchers: LoaderWatcher[];
  geometry: THREE.Geometry;
  xhr: XMLHttpRequest;
  garbageCollectionEnabled: boolean;

  constructor() {
    this.state = LoaderState.INIT;
    this.watchers = [];
    this.xhr = null;
    this.garbageCollectionEnabled = true;
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
    this.watchers = [];

    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
  }

  triggerWatchers() {
    this.watchers.forEach(watcher => watcher(this.geometry));
  }

  loadFromRemote(designId: string) {
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

    this.state = LoaderState.LOADED;
    this.triggerWatchers();
  }
}

class DesignManager {
  loaders: { [index: string]: DesignLoader };

  constructor() {
    this.loaders = {};
  }

  getLoader(designId: string) {
    return this.loaders[designId];
  }

  getOrCreateLoader(designId: string) {
    const loader = this.getLoader(designId);
    if (loader) return loader;
    return this.loaders[designId] = new DesignLoader();
  }

  watch(designId: string, watcher: LoaderWatcher) {
    let loader = this.loaders[designId];
    if (!loader) {
      loader = this.loaders[designId] = new DesignLoader();
    }

    loader.addWatcher(watcher);

    if (loader.state === LoaderState.INIT) loader.loadFromRemote(designId);
  }

  unwatch(designId: string, watcher: LoaderWatcher) {
    const loader = this.loaders[designId];
    invariant(loader, `Cannot find loader for ${designId}`);

    loader.removeWatcher(watcher);

    if (loader.isReadyToDispose()) {
      loader.dispose();
      delete this.loaders[designId];
    }
  }

  dispose() {
    Object.keys(this.loaders).forEach(designId => {
      const loader = this.loaders[designId];
      // invariant(!loader.watcherExists(), `loader ${designId} has watchers on dispose`);
      loader.dispose();
    });
    this.loaders = {};
  }
}

export default DesignManager;
