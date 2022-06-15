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
layout (binding = 2) uniform sampler2D vsm;

vec3 gray(vec3 color)
{
  return vec3((color.r + color.g + color.b) / 3);
}

vec3 grayWithRed(vec3 color)
{
  bool colorBorder = (color.r > 0.65f && color.g < 0.25f && color.b < 0.25f);
  if (!colorBorder)
    color = gray(color);
  return color;  
}

vec3 grayWithGreen(vec3 color)
{
  bool colorBorder = (color.r < 0.25f && color.g > 0.65f && color.b < 0.25f);
  if (!colorBorder)
    color = gray(color);
  return color;  
}

vec3 grayWithBlue(vec3 color)
{
  bool colorBorder = (color.r < 0.25f && color.g < 0.25f && color.b > 0.65f);
  if (!colorBorder)
    color = gray(color);
  return color;  
}

vec3 inverse(vec3 color)
{
  return vec3(1.0f) - color;
}

vec3 sepia(vec3 color)
{
  float r = color.r;
  float g = color.g;
  float b = color.b;
  color.r = r * 0.393f + g * 0.769f + b * 0.189f;
  color.g = r * 0.349f + g * 0.686f + b * 0.168f;
  color.b = r * 0.272f + g * 0.534f + b * 0.131f;
  return color;
}

vec3 uncharted2_tonemap_partial(vec3 x)
{
    float A = 0.15f;
    float B = 0.50f;
    float C = 0.10f;
    float D = 0.20f;
    float E = 0.02f;
    float F = 0.30f;
    return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;
}

vec3 uncharted2_filmic(vec3 v)
{
    float exposure_bias = 2.0f;
    vec3 curr = uncharted2_tonemap_partial(v * exposure_bias);

    vec3 W = vec3(11.2f);
    vec3 white_scale = vec3(1.0f) / uncharted2_tonemap_partial(W);
    return curr * white_scale;
}

vec3 tonemapping(vec3 color, int effect)
{
  if (effect == 1)
  {
    color = gray(color);
  }
  else if (effect == 2)
  {
    color = grayWithRed(color);
  }
  else if (effect == 3)
  {
    color = grayWithGreen(color);
  }
  else if (effect == 4)
  {
    color = grayWithBlue(color);
  }
  else if (effect == 5)
  {
    color = inverse(color);
  }
  else if (effect == 6)
  {
    color = sepia(color);
  }
  else if (effect == 7)
  {
    color = uncharted2_tonemap_partial(color);
  }
  else if (effect == 8)
  {
    color = uncharted2_filmic(color);
  }
  return color;
}

void main()
{
  const vec4 posLightClipSpace = Params.lightMatrix*vec4(surf.wPos, 1.0f); // 
  const vec3 posLightSpaceNDC  = posLightClipSpace.xyz/posLightClipSpace.w;    // for orto matrix, we don't need perspective division, you can remove it if you want; this is general case;
  const vec2 shadowTexCoord    = posLightSpaceNDC.xy*0.5f + vec2(0.5f, 0.5f);  // just shift coords from [-1,1] to [0,1]               
    
  const bool  outOfView = (shadowTexCoord.x < 0.0001f || shadowTexCoord.x > 0.9999f || shadowTexCoord.y < 0.0001f || shadowTexCoord.y > 0.9999f);
  float shadow = 0.0f;

  if (Params.vsm)
  {
    const float r = posLightSpaceNDC.z;
    const float mu = textureLod(vsm, shadowTexCoord, 0).x;
    const float s2 = max(textureLod(vsm, shadowTexCoord, 0).y - mu * mu, 0.001f);
    const float pmax = s2 / (s2 + (r - mu) * (r - mu));
    shadow = max(r < mu ? 1.0f : 0.0f, pmax);
  }
  else
  {
    shadow = ((posLightSpaceNDC.z < textureLod(shadowMap, shadowTexCoord, 0).x + 0.001f) || outOfView) ? 1.0f : 0.0f;
  }

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
  vec4 color = (lightColor*shadow + vec4(0.1f)) * vec4(Params.baseColor, 1.0f) * intensity;
  if (Params.normalColor)
  {
    color = vec4(surf.wNorm, 1.0f);
  }
    
  out_fragColor = vec4(tonemapping(color.rgb, Params.effectType), 1.0f);
}
