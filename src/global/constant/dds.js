/*

  Direct Draw Surface
  https://docs.microsoft.com/en-us/windows/desktop/direct3ddds/dx-graphics-dds-pguide

*/
export const DDS_MAGIC = 0x20534444;
export const DDSD_CAPS = 0x1;
export const DDSD_HEIGHT = 0x2;
export const DDSD_WIDTH = 0x4;
export const DDSD_PITCH = 0x8;
export const DDSD_PIXELFORMAT = 0x1000;
export const DDSD_MIPMAPCOUNT = 0x20000;
export const DDSD_LINEARSIZE = 0x80000;
export const DDSD_DEPTH = 0x800000;

export const DDSCAPS_COMPLEX = 0x8;
export const DDSCAPS_MIPMAP = 0x400000;
export const DDSCAPS_TEXTURE = 0x1000;

export const DDSCAPS2_CUBEMAP = 0x200;
export const DDSCAPS2_CUBEMAP_POSITIVEX = 0x400;
export const DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800;
export const DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000;
export const DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000;
export const DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000;
export const DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000;
export const DDSCAPS2_VOLUME = 0x200000;

export const DDPF_ALPHAPIXELS = 0x1;
export const DDPF_ALPHA = 0x2;
export const DDPF_FOURCC = 0x4;
export const DDPF_RGB = 0x40;
export const DDPF_YUV = 0x200;
export const DDPF_LUMINANCE = 0x20000;

export const DDS_HEADER_LENGTH_INT = 31;
export const DDS_HEADER_OFFSET_MAGIC = 0;
export const DDS_HEADER_OFFSET_SIZE = 1;
export const DDS_HEADER_OFFSET_FLAGS = 2;
export const DDS_HEADER_OFFSET_HEIGHT = 3;
export const DDS_HEADER_OFFSET_WIDTH = 4;
export const DDS_HEADER_OFFSET_MIPMAP_COUNT = 7;
export const DDS_HEADER_OFFSET_PF_FLAGS = 20;
export const DDS_HEADER_OFFSET_PF_FOURCC = 21;
export const DDS_HEADER_OFFSET_RGB_BPP = 22;
export const DDS_HEADER_OFFSET_R_MASK = 23;
export const DDS_HEADER_OFFSET_G_MASK = 24;
export const DDS_HEADER_OFFSET_B_MASK = 25;
export const DDS_HEADER_OFFSET_A_MASK = 26;
export const DDS_HEADER_OFFSET_CAPS1 = 27;
export const DDS_HEADER_OFFSET_CAPS2 = 28;
export const DDS_HEADER_OFFSET_CAPS3 = 29;
export const DDS_HEADER_OFFSET_CAPS4 = 30;
export const DDS_HEADER_OFFSET_DXGI_FORMAT = 32;


export const FOURCC_DXT1 = 827611204;
export const FOURCC_DXT5 = 894720068;
export const FOURCC_DXT3 = 861165636;
export const FOURCC_DXT10 = 827611204;
export const FOURCC_D3DFMT_R16G16B16A16F = 113;
export const FOURCC_D3DFMT_R32G32B32A32F = 116;
export const DXGI_FORMAT_R16G16B16A16_FLOAT = 10;
export const DXGI_FORMAT_B8G8R8X8_UNORM = 88;
