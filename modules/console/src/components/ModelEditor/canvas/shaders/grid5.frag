precision highp float;

uniform float gridThickness;
uniform vec3 gridColor;

varying vec2 vUV;

void main(void) {
    vec2 thickness = vec2(gridThickness, gridThickness);

    vec2 f = fract(vUV);
    f = min(f, 1.0 - f);

    vec2 delta = fwidth(f);
    f = smoothstep(f - delta, f + delta, thickness);

    float opacity = clamp(f.x + f.y, 0.0, 1.0);
    gl_FragColor = vec4(gridColor, opacity);
}
