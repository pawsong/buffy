precision highp float;

uniform vec3 gridColor;
uniform float gridThickness;
uniform float opacity;

varying vec2 vUv;
varying vec3 vColor;

void main(void) {
    vec2 thickness = vec2(gridThickness, gridThickness);

    vec2 f = fract(vUv);
    f = min(f, 1.0 - f);

    vec2 delta = fwidth(f);
    f = smoothstep(f - delta, f + delta, thickness);

    float w = clamp(f.x + f.y, 0.0, 1.0);
    vec3 c = vColor * (1.0 - w) + gridColor * w;

    gl_FragColor = vec4(c, max(opacity, w));
}
