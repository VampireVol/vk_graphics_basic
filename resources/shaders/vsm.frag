#version 450
#extension GL_ARB_separate_shader_objects : enable
#extension GL_GOOGLE_include_directive : require

layout (location = 0) out vec2 out_fragColor;
layout (binding = 0) uniform sampler2D shadowMap;

void main()
{
    vec2 dim = textureSize(shadowMap, 0);

    int r = 2;
    int n = (2 * r + 1) * (2 * r + 1);
    vec2 sum = vec2(0.0f, 0.0f);

    for (float i = -r; i <= r; i++) 
    {
        for (float j = -r; j <= r; j++) 
        {
            float t = textureLod(shadowMap, (gl_FragCoord.xy + vec2(i, j)) / dim, 0).x;
            sum += vec2(t, t * t);
        }
    }

    out_fragColor = sum / n;
}