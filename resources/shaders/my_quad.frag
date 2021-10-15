#version 450
#extension GL_ARB_separate_shader_objects : enable

layout(location = 0) out vec4 color;

layout (binding = 0) uniform sampler2D colorTex;

layout (location = 0 ) in VS_OUT
{
  vec2 texCoord;
} surf;

const int sampleSize = 3;

void sort(int size, float pixels[sampleSize * sampleSize], out float pixelsOut[sampleSize * sampleSize])
{
  for (int i = 0; i < size - 1; ++i)
  {
	for (int j = 0; j < size - 1; ++j)
	{
	  if (pixels[j] > pixels[j + 1])
	  {
		float t = pixels[j];
		pixels[j] = pixels[j + 1];
		pixels[j + 1] = t;
	  }
	}
  }
  for (int i = 0; i < size - 1; ++i)
  {
	pixelsOut[i] = pixels[i];
  }
}

void main()
{
  int halfSampleSize = sampleSize / 2;
  int medianSample = sampleSize * sampleSize / 2;
  vec2 dxy = 1.0 / textureSize(colorTex, 0);
  float pixelsR[sampleSize * sampleSize];
  float pixelsG[sampleSize * sampleSize];
  float pixelsB[sampleSize * sampleSize];
  for (int i = 0; i < sampleSize; ++i)
  {
	for (int j = 0; j < sampleSize; ++j)
	{
	  vec4 pixel = textureLod(colorTex, surf.texCoord + vec2(j - halfSampleSize, i - halfSampleSize) * dxy, 0);
	  pixelsR[j + i * sampleSize] = pixel.x;
	  pixelsG[j + i * sampleSize] = pixel.y;
	  pixelsB[j + i * sampleSize] = pixel.z;
	}
  }
  sort(sampleSize * sampleSize, pixelsR, pixelsR);
  sort(sampleSize * sampleSize, pixelsG, pixelsG);
  sort(sampleSize * sampleSize, pixelsB, pixelsB);

  color = vec4(pixelsR[medianSample], pixelsG[medianSample], pixelsB[medianSample], 1.0f);
}
