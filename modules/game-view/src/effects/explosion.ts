import * as THREE from 'three';
window.THREE = THREE; // SPE requires this

import * as SPE from 'shader-particle-engine/build/SPE';

function createExplosion(scene, maxAge, position) {
  const group = new SPE.Group( {
    texture: {
      value: THREE.ImageUtils.loadTexture( './assets/sprite-explosion2.png' ),
      frames: new THREE.Vector2( 5, 5 ),
      loop: 1
    },
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    scale: 600
  });

  const shockwaveGroup = new SPE.Group( {
    texture: {
      value: THREE.ImageUtils.loadTexture( './assets/smokeparticle.png' ),
    },
    depthTest: false,
    depthWrite: true,
    blending: THREE.NormalBlending,
  });

  const shockwave = new SPE.Emitter( {
    particleCount: 200,
    type: SPE.distributions.DISC,
    position: {
      radius: 5,
      spread: new THREE.Vector3( 5 )
    },
    maxAge: {
      value: maxAge,
      spread: 0
    },

    // duration: 1,
    activeMultiplier: 2000,
    velocity: {
      value: new THREE.Vector3( 40 )
    },
    rotation: {
      axis: new THREE.Vector3( 1, 0, 0 ),
      angle: Math.PI * 0.5,
      static: true
    },
    size: { value: 2 },
    color: {
      value: [
        new THREE.Color( 0.4, 0.2, 0.1 ),
        new THREE.Color( 0.2, 0.2, 0.2 )
      ]
    },
    opacity: { value: [0.5, 0.2, 0] }
  });

  const debris = new SPE.Emitter( {
    particleCount: 100,
    type: SPE.distributions.SPHERE,
    position: {
      radius: 0.1,
    },
    maxAge: {
      value: maxAge,
    },

    // duration: 2,
    activeMultiplier: 40,
    velocity: {
      value: new THREE.Vector3( 100 )
    },
    acceleration: {
      value: new THREE.Vector3( 0, -20, 0 ),
      distribution: SPE.distributions.BOX
    },
    size: { value: 2 },
    drag: {
      value: 1
    },
    color: {
      value: [
        new THREE.Color( 1, 1, 1 ),
        new THREE.Color( 1, 1, 0 ),
        new THREE.Color( 1, 0, 0 ),
        new THREE.Color( 0.4, 0.2, 0.1 )
      ]
    },
    opacity: { value: [0.4, 0] }
  });

  const fireball = new SPE.Emitter( {
    particleCount: 20,
    type: SPE.distributions.SPHERE,
    position: {
      radius: 1
    },
    maxAge: { value: maxAge },

    // duration: 1,
    activeMultiplier: 20,
    velocity: {
      value: new THREE.Vector3( 10 )
    },
    size: { value: [20, 100] },
    color: {
      value: [
        new THREE.Color( 0.5, 0.1, 0.05 ),
        new THREE.Color( 0.2, 0.2, 0.2 )
      ]
    },
    opacity: { value: [0.5, 0.35, 0.1, 0] }
  });

  const mist = new SPE.Emitter( {
    particleCount: 50,
    position: {
      spread: new THREE.Vector3( 10, 10, 10 ),
      distribution: SPE.distributions.SPHERE
    },
    maxAge: { value: maxAge },

    // duration: 1,
    activeMultiplier: 2000,
    velocity: {
      value: new THREE.Vector3( 8, 3, 10 ),
      distribution: SPE.distributions.SPHERE
    },
    size: { value: 40 },
    color: {
      value: new THREE.Color( 0.2, 0.2, 0.2 )
    },
    opacity: { value: [0, 0, 0.2, 0] }
  });

  const flash = new SPE.Emitter( {
    particleCount: 50,
    position: { spread: new THREE.Vector3( 5, 5, 5 ) },
    velocity: {
      spread: new THREE.Vector3( 30 ),
      distribution: SPE.distributions.SPHERE
    },
    size: { value: [2, 20, 20, 20] },
    maxAge: { value: maxAge },
    activeMultiplier: 2000,
    opacity: { value: [0.5, 0.25, 0, 0] }
  });

  group.addEmitter( fireball ).addEmitter( flash );
  shockwaveGroup.addEmitter( debris ).addEmitter( mist );

  scene.add(group.mesh);
  scene.remove(shockwaveGroup.mesh);

  group.mesh.position.x = 50 * position.x -25;
  group.mesh.position.z = 50 * position.y -25;
  group.mesh.position.y = 70;

  shockwaveGroup.mesh.position.x = 50 * position.x -25;
  shockwaveGroup.mesh.position.z = 50 * position.y -25;
  shockwaveGroup.mesh.position.y = 70;

  let age = 0;

  function update(dt) {
    age += dt;
    if (age > maxAge * 1000) {
      // Remove group
      scene.remove(group.mesh);
      group.dispose();

      // Remove shockwaveGroup
      scene.remove(shockwaveGroup.mesh);
      shockwaveGroup.dispose();
      return false;
    }

    group.tick(dt / 1000);
    shockwaveGroup.tick(dt / 1000);
    return true;
  }

  return { update };
};

export {
  createExplosion,
}
