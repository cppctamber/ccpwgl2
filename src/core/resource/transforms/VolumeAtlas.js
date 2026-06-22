/**
 * Volume atlas helpers
 * - Detects strip atlases in 2D images
 * - Builds a 2D RGBA atlas from an UNCOMPRESSED DDS volume payload (mip0 only)
 */

export class VolumeAtlas
{
    static Detect2DAtlas(width, height)
    {
        if (!width || !height) return { isAtlas: false, axis: "y", slices: 1 };

        // Vertical strip: height = width * N
        if (height % width === 0)
        {
            const slices = height / width;
            if (slices >= 2) return { isAtlas: true, axis: "y", slices };
        }

        // Horizontal strip: width = height * N
        if (width % height === 0)
        {
            const slices = width / height;
            if (slices >= 2) return { isAtlas: true, axis: "x", slices };
        }

        return { isAtlas: false, axis: "y", slices: 1 };
    }

    /**
     * DDS_HEADER.depth read (legacy):
     * depth DWORD is at index 6 in Int32Array view of header (after magic).
     * This matches your previous approach.
     */
    static ReadDDSDepth(arrayBuffer, headerIntCount = 32)
    {
        const header = new Int32Array(arrayBuffer, 0, headerIntCount);
        return Math.max(1, header[6] || 1);
    }

    /**
     * Builds an RGBA8 atlas from an uncompressed volume DDS, mip0 only.
     *
     * @param {ArrayBuffer} arrayBuffer
     * @param {object} info - {width,height,isVolume,isCompressed,bpp,isLuminance,hasAlpha,rOffset,gOffset,bOffset,aOffset,dataOffset}
     * @param {{axis?:"x"|"y", mipLevel?:number, headerIntCount?:number}} opt
     */
    static FromDDSUncompressed(arrayBuffer, info, opt = {})
    {
        const axis = opt.axis ?? "y";
        const mipLevel = opt.mipLevel ?? 0;
        const headerIntCount = opt.headerIntCount ?? 32;

        if (!info.isVolume) throw new Error("VolumeAtlas.FromDDSUncompressed: DDS is not a volume");
        if (info.isCompressed) throw new Error("VolumeAtlas.FromDDSUncompressed: compressed volume DDS not supported");
        if (mipLevel !== 0) throw new Error("VolumeAtlas.FromDDSUncompressed: mipLevel != 0 not implemented");

        const depth = VolumeAtlas.ReadDDSDepth(arrayBuffer, headerIntCount);

        const sliceSize = info.width;
        if (info.width !== info.height) throw new Error("VolumeAtlas.FromDDSUncompressed: expected square slices");

        const atlasW = axis === "y" ? sliceSize : sliceSize * depth;
        const atlasH = axis === "y" ? sliceSize * depth : sliceSize;

        const bpp = info.bpp ?? 32;
        const srcBppBytes = bpp >> 3;
        const sliceBytes = sliceSize * sliceSize * srcBppBytes;

        const out = new Uint8Array(atlasW * atlasH * 4);

        let offset = info.dataOffset;

        const rO = info.rOffset ?? 0;
        const gO = info.gOffset ?? 1;
        const bO = info.bOffset ?? 2;
        const aO = info.aOffset ?? 3;

        for (let z = 0; z < depth; z++)
        {
            const src = new Uint8Array(arrayBuffer, offset, sliceBytes);
            offset += sliceBytes;

            const dstX0 = axis === "y" ? 0 : z * sliceSize;
            const dstY0 = axis === "y" ? z * sliceSize : 0;

            for (let y = 0; y < sliceSize; y++)
            {
                for (let x = 0; x < sliceSize; x++)
                {
                    const si = (y * sliceSize + x) * srcBppBytes;

                    let r = 0, g = 0, b = 0, a = 255;

                    if (info.isLuminance)
                    {
                        r = g = b = src[si + 0];
                        if (info.hasAlpha && srcBppBytes >= 2) a = src[si + 1];
                    }
                    else if (bpp === 24)
                    {
                        r = src[si + rO];
                        g = src[si + gO];
                        b = src[si + bO];
                    }
                    else
                    {
                        r = src[si + rO];
                        g = src[si + gO];
                        b = src[si + bO];
                        a = (srcBppBytes >= 4) ? src[si + aO] : 255;
                    }

                    const dx = dstX0 + x;
                    const dy = dstY0 + y;
                    const di = (dy * atlasW + dx) * 4;

                    out[di + 0] = r;
                    out[di + 1] = g;
                    out[di + 2] = b;
                    out[di + 3] = a;
                }
            }
        }

        return { axis, slices: depth, width: atlasW, height: atlasH, bytes: out };
    }
}
