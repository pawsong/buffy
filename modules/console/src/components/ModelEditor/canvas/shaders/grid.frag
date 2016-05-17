precision highp float;

uniform float opacity;

varying vec2 vUV;
varying vec3 vColor;

void main(void) {
    vec2 thickness = vec2(0.01, 0.01);

    vec2 f = fract(vUV);
    f = min(f, 1.0 - f);

    vec2 delta = fwidth(f);
    f = smoothstep(f - delta, f + delta, thickness);

    float c = clamp(f.x + f.y, 0.0, 0.4) - 1.0;
    gl_FragColor = vec4(vColor.rgb * -c, opacity);
}
