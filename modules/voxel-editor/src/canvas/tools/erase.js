import store, {
  actions,
} from '../../store';

import highlightVoxel from './highlightVoxel';

export default [
  highlightVoxel,

  ({
    container,
    voxels,
  }) => {
    return {
      onMouseUp({
        intersect,
      }) {
        if (!intersect) { return; }

        const { voxel } = intersect.object;
        if (!voxel) { return; }

        actions.removeVoxel(voxel.position);
      },
    };
  },
]
