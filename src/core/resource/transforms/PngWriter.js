import { device } from "global";
import { TextureFormatDDS } from "core/resource/formats/TextureFormatDDS";
import { VolumeAtlas } from "core/resource/transforms/VolumeAtlas";

export class PngWriter
{
    static ToDataUrlRGBA(bytes, width, height)
    {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(bytes);
        ctx.putImageData(imageData, 0, 0);

        return canvas.toDataURL("image/png");
    }

    static ToBlobRGBA(bytes, width, height, cb, type = "image/png", quality)
    {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(bytes);
        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob(cb, type, quality);
    }

    static VolumeDdsToPNG(arrayBuffer, axis="y")
    {
        const gl = device.gl;
        const info = TextureFormatDDS.ParseDDS(arrayBuffer, gl);

        if (!info.isVolume) throw new Error("Not a volume DDS");
        if (info.isCompressed) throw new Error("Compressed volume DDS requires BC decode");

        const atlas = VolumeAtlas.FromDDSUncompressed(arrayBuffer, info, {
            axis,
            mipLevel: 0,
            headerIntCount: TextureFormatDDS.DDS_HEADER_LENGTH_INT
        });

        return this.ToDataUrlRGBA(atlas.bytes, atlas.width, atlas.height);
    }

}
