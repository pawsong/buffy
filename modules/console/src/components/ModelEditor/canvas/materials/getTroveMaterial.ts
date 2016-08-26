import * as THREE from 'three';

const tiledGlassVertexShader = require('raw!../shaders/tiledGlass.vert');
const tiledGlassFragmentShader = require('raw!../shaders/tiledGlass.frag');

function createTroveMaterial() {
  let mType1Alpha1Specular1: THREE.MeshPhongMaterial;
  let mType1Alpha1Specular2: THREE.MeshPhongMaterial;
  let mType1Alpha1Specular3: THREE.MeshPhongMaterial;
  let mType1Alpha1Specular4: THREE.MeshPhongMaterial;
  let mType1Alpha1Specular5: THREE.MeshPhongMaterial;

  let mType2Alpha1Specular1: THREE.MeshPhongMaterial;
  let mType2Alpha2Specular1: THREE.MeshPhongMaterial;
  let mType2Alpha3Specular1: THREE.MeshPhongMaterial;
  let mType2Alpha4Specular1: THREE.MeshPhongMaterial;
  let mType2Alpha5Specular1: THREE.MeshPhongMaterial;
  let mType2Alpha6Specular1: THREE.MeshPhongMaterial;
  let mType2Alpha7Specular1: THREE.MeshPhongMaterial;
  let mType2Alpha8Specular1: THREE.MeshPhongMaterial;

  let mType3Alpha1Specular1: THREE.ShaderMaterial;
  let mType3Alpha2Specular1: THREE.ShaderMaterial;
  let mType3Alpha3Specular1: THREE.ShaderMaterial;
  let mType3Alpha4Specular1: THREE.ShaderMaterial;
  let mType3Alpha5Specular1: THREE.ShaderMaterial;
  let mType3Alpha6Specular1: THREE.ShaderMaterial;
  let mType3Alpha7Specular1: THREE.ShaderMaterial;
  let mType3Alpha8Specular1: THREE.ShaderMaterial;

  let mType4Alpha1Specular1: THREE.MeshPhongMaterial;

  let mType5Alpha1Specular1: THREE.MeshPhongMaterial;
  let mType5Alpha2Specular1: THREE.MeshPhongMaterial;
  let mType5Alpha3Specular1: THREE.MeshPhongMaterial;
  let mType5Alpha4Specular1: THREE.MeshPhongMaterial;
  let mType5Alpha5Specular1: THREE.MeshPhongMaterial;
  let mType5Alpha6Specular1: THREE.MeshPhongMaterial;
  let mType5Alpha7Specular1: THREE.MeshPhongMaterial;
  let mType5Alpha8Specular1: THREE.MeshPhongMaterial;

  // TYPE 1

  // Rough (default)
  mType1Alpha1Specular1 = new THREE.MeshPhongMaterial({
    vertexColors: THREE.VertexColors,
  });

  // Metal
  mType1Alpha1Specular2 = new THREE.MeshPhongMaterial({
    vertexColors: THREE.VertexColors,
  });
  mType1Alpha1Specular2.specular = mType1Alpha1Specular2.color.multiplyScalar(0.5);

  // TODO: Water
  mType1Alpha1Specular3 = new THREE.MeshPhongMaterial({
    vertexColors: THREE.VertexColors,
  });

  // TODO: Iridescent
  mType1Alpha1Specular4 = new THREE.MeshPhongMaterial({
    vertexColors: THREE.VertexColors,
  });

  // TODO: Waxy
  mType1Alpha1Specular5 = new THREE.MeshPhongMaterial({
    vertexColors: THREE.VertexColors,
  });

  // TYPE 2

  mType2Alpha1Specular1 = new THREE.MeshPhongMaterial({
    vertexColors: THREE.VertexColors,
  });
  mType2Alpha1Specular1.transparent = true;
  mType2Alpha1Specular1.opacity = 0x10 / 0xff;

  mType2Alpha2Specular1 = mType2Alpha1Specular1.clone();
  mType2Alpha2Specular1.opacity = 0x30 / 0xff;

  mType2Alpha3Specular1 = mType2Alpha1Specular1.clone();
  mType2Alpha3Specular1.opacity = 0x50 / 0xff;

  mType2Alpha4Specular1 = mType2Alpha1Specular1.clone();
  mType2Alpha4Specular1.opacity = 0x70 / 0xff;

  mType2Alpha5Specular1 = mType2Alpha1Specular1.clone();
  mType2Alpha5Specular1.opacity = 0x90 / 0xff;

  mType2Alpha6Specular1 = mType2Alpha1Specular1.clone();
  mType2Alpha6Specular1.opacity = 0xb0 / 0xff;

  mType2Alpha7Specular1 = mType2Alpha1Specular1.clone();
  mType2Alpha7Specular1.opacity = 0xd0 / 0xff;

  mType2Alpha8Specular1 = mType2Alpha1Specular1.clone();
  mType2Alpha8Specular1.opacity = 0xf0 / 0xff;

  // TYPE 3

  mType3Alpha1Specular1 = new THREE.ShaderMaterial({
    vertexShader: tiledGlassVertexShader,
    fragmentShader: tiledGlassFragmentShader,
    transparent: true,
  });
  mType3Alpha1Specular1.extensions.derivatives = true;
  mType3Alpha1Specular1.uniforms = { opacity: { type: 'f', value: 0x10 / 0xff } };

  mType3Alpha2Specular1 = mType3Alpha1Specular1.clone();
  mType3Alpha2Specular1.uniforms = { opacity: { type: 'f', value: 0x30 / 0xff } };

  mType3Alpha3Specular1 = mType3Alpha1Specular1.clone();
  mType3Alpha3Specular1.uniforms = { opacity: { type: 'f', value: 0x50 / 0xff } };

  mType3Alpha4Specular1 = mType3Alpha1Specular1.clone();
  mType3Alpha4Specular1.uniforms = { opacity: { type: 'f', value: 0x70 / 0xff } };

  mType3Alpha5Specular1 = mType3Alpha1Specular1.clone();
  mType3Alpha5Specular1.uniforms = { opacity: { type: 'f', value: 0x90 / 0xff } };

  mType3Alpha6Specular1 = mType3Alpha1Specular1.clone();
  mType3Alpha6Specular1.uniforms = { opacity: { type: 'f', value: 0xb0 / 0xff } };

  mType3Alpha7Specular1 = mType3Alpha1Specular1.clone();
  mType3Alpha7Specular1.uniforms = { opacity: { type: 'f', value: 0xd0 / 0xff } };

  mType3Alpha8Specular1 = mType3Alpha1Specular1.clone();
  mType3Alpha8Specular1.uniforms = { opacity: { type: 'f', value: 0xf0 / 0xff } };

  // TYPE 4

  mType4Alpha1Specular1 = new THREE.MeshPhongMaterial({
    vertexColors: THREE.VertexColors,
  });
  mType4Alpha1Specular1.emissive = mType4Alpha1Specular1.color.multiplyScalar(0.5);

  // TYPE 5

  mType5Alpha1Specular1 = new THREE.MeshPhongMaterial({
    vertexColors: THREE.VertexColors,
  });
  mType5Alpha1Specular1.emissive = mType5Alpha1Specular1.color.multiplyScalar(0.5);
  mType5Alpha1Specular1.transparent = true;
  mType5Alpha1Specular1.opacity = 0x10 / 0xff;

  mType5Alpha2Specular1 = mType5Alpha1Specular1.clone();
  mType5Alpha2Specular1.opacity = 0x30 / 0xff;

  mType5Alpha3Specular1 = mType5Alpha1Specular1.clone();
  mType5Alpha3Specular1.opacity = 0x50 / 0xff;

  mType5Alpha4Specular1 = mType5Alpha1Specular1.clone();
  mType5Alpha4Specular1.opacity = 0x70 / 0xff;

  mType5Alpha5Specular1 = mType5Alpha1Specular1.clone();
  mType5Alpha5Specular1.opacity = 0x90 / 0xff;

  mType5Alpha6Specular1 = mType5Alpha1Specular1.clone();
  mType5Alpha6Specular1.opacity = 0xb0 / 0xff;

  mType5Alpha7Specular1 = mType5Alpha1Specular1.clone();
  mType5Alpha7Specular1.opacity = 0xd0 / 0xff;

  mType5Alpha8Specular1 = mType5Alpha1Specular1.clone();
  mType5Alpha8Specular1.opacity = 0xf0 / 0xff;

  return new THREE.MultiMaterial([
    new THREE.MeshBasicMaterial({ visible: false }), // PADDING

    mType1Alpha1Specular1, // const TYPE1_ALPHA1_SPECULAR1 = 0x01000000; // 01
    mType1Alpha1Specular2, // const TYPE1_ALPHA1_SPECULAR2 = 0x02000000; // 02
    mType1Alpha1Specular3, // const TYPE1_ALPHA1_SPECULAR3 = 0x03000000; // 03
    mType1Alpha1Specular4, // const TYPE1_ALPHA1_SPECULAR4 = 0x04000000; // 04
    mType1Alpha1Specular5, // const TYPE1_ALPHA1_SPECULAR5 = 0x05000000; // 05

    mType4Alpha1Specular1, // const TYPE4_ALPHA1_SPECULAR1 = 0x06000000; // 06

    mType2Alpha1Specular1, // const TYPE2_ALPHA1_SPECULAR1 = 0x07000000; // 07
    mType2Alpha2Specular1, // const TYPE2_ALPHA2_SPECULAR1 = 0x08000000; // 08
    mType2Alpha3Specular1, // const TYPE2_ALPHA3_SPECULAR1 = 0x09000000; // 09
    mType2Alpha4Specular1, // const TYPE2_ALPHA4_SPECULAR1 = 0x0a000000; // 10
    mType2Alpha5Specular1, // const TYPE2_ALPHA5_SPECULAR1 = 0x0b000000; // 11
    mType2Alpha6Specular1, // const TYPE2_ALPHA6_SPECULAR1 = 0x0c000000; // 12
    mType2Alpha7Specular1, // const TYPE2_ALPHA7_SPECULAR1 = 0x0d000000; // 13
    mType2Alpha8Specular1, // const TYPE2_ALPHA8_SPECULAR1 = 0x0e000000; // 14

    mType3Alpha1Specular1, // const TYPE3_ALPHA1_SPECULAR1 = 0x0f000000; // 15
    mType3Alpha2Specular1, // const TYPE3_ALPHA2_SPECULAR1 = 0x10000000; // 16
    mType3Alpha3Specular1, // const TYPE3_ALPHA3_SPECULAR1 = 0x11000000; // 17
    mType3Alpha4Specular1, // const TYPE3_ALPHA4_SPECULAR1 = 0x12000000; // 18
    mType3Alpha5Specular1, // const TYPE3_ALPHA5_SPECULAR1 = 0x13000000; // 19
    mType3Alpha6Specular1, // const TYPE3_ALPHA6_SPECULAR1 = 0x14000000; // 20
    mType3Alpha7Specular1, // const TYPE3_ALPHA7_SPECULAR1 = 0x15000000; // 21
    mType3Alpha8Specular1, // const TYPE3_ALPHA8_SPECULAR1 = 0x16000000; // 22

    mType5Alpha1Specular1, // const TYPE5_ALPHA1_SPECULAR1 = 0x17000000; // 23
    mType5Alpha2Specular1, // const TYPE5_ALPHA2_SPECULAR1 = 0x18000000; // 24
    mType5Alpha3Specular1, // const TYPE5_ALPHA3_SPECULAR1 = 0x19000000; // 25
    mType5Alpha4Specular1, // const TYPE5_ALPHA4_SPECULAR1 = 0x1a000000; // 26
    mType5Alpha5Specular1, // const TYPE5_ALPHA5_SPECULAR1 = 0x1b000000; // 27
    mType5Alpha6Specular1, // const TYPE5_ALPHA6_SPECULAR1 = 0x1c000000; // 28
    mType5Alpha7Specular1, // const TYPE5_ALPHA7_SPECULAR1 = 0x1d000000; // 29
    mType5Alpha8Specular1, // const TYPE5_ALPHA8_SPECULAR1 = 0x1e000000; // 30
  ]);
}

let cached: THREE.MultiMaterial;

function getTroveMaterial (clone: boolean): THREE.MultiMaterial {
  if (clone && !cached) return createTroveMaterial();

  if (!cached) cached = createTroveMaterial();
  return clone ? cached.clone() : cached;
}

export default getTroveMaterial;
