#version 450
#extension GL_ARB_separate_shader_objects : enable
#extension GL_GOOGLE_include_directive : require

#include "common.h"

layout(location = 0) out vec4 out_fragColor;

layout (location = 0 ) in VS_OUT
{
  vec3 wPos;
  vec3 wNorm;
  vec3 wTangent;
  vec2 texCoord;
  vec4 color;
} surf;

layout(binding = 0, set = 0) uniform AppData
{
  UniformParams Params;
};

layout (binding = 1) uniform sampler2D shadowMap;

void main()
{
  const vec4 posLightClipSpace = Params.lightMatrix*vec4(surf.wPos, 1.0f); // 
  const vec3 posLightSpaceNDC  = posLightClipSpace.xyz/posLightClipSpace.w;    // for orto matrix, we don't need perspective division, you can remove it if you want; this is general case;
  const vec2 shadowTexCoord    = posLightSpaceNDC.xy*0.5f + vec2(0.5f, 0.5f);  // just shift coords from [-1,1] to [0,1]               
    
  const bool  outOfView = (shadowTexCoord.x < 0.0001f || shadowTexCoord.x > 0.9999f || shadowTexCoord.y < 0.0001f || shadowTexCoord.y > 0.9999f);
  const float shadow    = ((posLightSpaceNDC.z < textureLod(shadowMap, shadowTexCoord, 0).x + 0.001f) || outOfView) ? 1.0f : 0.0f;

  float intensity =  0.0f;
  float inner = cos(radians(Params.inner));
  float outer = cos(radians(Params.outer));
  float radius = Params.radius;
  
  vec3 lightDir = normalize(Params.lightPos - surf.wPos);
  vec4 lightColor = max(dot(surf.wNorm, lightDir), 0.0f) * vec4(1.0f);
  float distance = length(Params.lightPos - surf.wPos);
  if (distance < Params.radius)
  {
    float theta = dot(lightDir, normalize(-Params.lightDir));
    float epsilon = inner - outer;
    if (epsilon > 0.0f)
      intensity = clamp((theta - outer) / epsilon, 0.0, 1.0);
  }
  out_fragColor = (lightColor*shadow + vec4(0.1f)) * vec4(Params.baseColor, 1.0f) * intensity;
}
