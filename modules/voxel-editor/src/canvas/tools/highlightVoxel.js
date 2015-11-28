export default ({
  container,
  voxels,
}) => {
  let objectHovered;
  return {
    onInteract({
      intersect,
    }) {
      if (objectHovered) {
        objectHovered.material.opacity = 1
        objectHovered = undefined;
      }

      if (!intersect) { return; }

      const { voxel } = intersect.object;
      if (!voxel) { return; }

      objectHovered = intersect.object;
      objectHovered.material.opacity = 0.5;
    },

    onLeave() {
      if (objectHovered) {
        objectHovered.material.opacity = 1
        objectHovered = undefined;
      }
    },
  };
};
