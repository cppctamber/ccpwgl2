import { meta } from "utils";
import { num } from "math";
import { resMan } from "global";
import { CjsDdsFormat } from "@carbonenginejs/runtime/resource/formats/dds";
import { Tw2Resource, ErrResourceFormatInvalid } from "./Tw2Resource";

/** Carbon Tr2LightProfileRes: an IES distribution or a baked R16F strip. */
@meta.define("Tr2LightProfileRes")
export class Tr2LightProfileRes extends Tw2Resource
{
    sourcePath = "";
    samples = null;
    _textureIndex = -1;

    // Shared slots mirror Carbon's LightProfileArray. The packed WebGL light
    // texture stores each strip's eleven mips in 256 RGBA32UI texels.
    static profiles = [];
    static revision = 0;
    static TEXEL_BASE = 196608;
    static TEXELS_PER_PROFILE = 256;

    /** Carbon's lp type override, cached separately from ordinary DDS textures. */
    static Resolve(path)
    {
        return path ? resMan.GetResource(/\.ies$/i.test(path) ? path : `dynamic:/lightprofile/${path}`) : null;
    }

    static GetResource(path)
    {
        const resource = new Tr2LightProfileRes();
        resource.sourcePath = path;
        return resource;
    }

    DoCustomLoad()
    {
        resMan.FetchRaw(resMan.tw2.GetURL(this.sourcePath || this.path), "arraybuffer")
            .then(data =>
            {
                this.OnLoaded();
                resMan.Queue(this, data);
            })
            .catch(err => this.OnError(err));
        return true;
    }

    Prepare(data)
    {
        if (/\.ies$/i.test(this.sourcePath || this.path))
        {
            this.samples = Tr2LightProfileRes.ParseIes(new TextDecoder().decode(data));
        }
        else
        {
            const texture = CjsDdsFormat.read(data, { emit: "texture" });
            if (texture.dimension !== "2d" || texture.width !== 1024 || texture.height !== 1
                || texture.pixelFormat !== "r16float" || texture.mipCount !== 11 || texture.arraySize > 1)
            {
                throw new ErrResourceFormatInvalid({ format: "light profile: expected 1024x1 R16F with 11 mips" });
            }
            this.samples = new Uint16Array(2048);
            let offset = 0;
            for (const mip of texture.subresources)
            {
                const view = new DataView(texture.data.buffer, texture.data.byteOffset + mip.offset, mip.byteLength);
                for (let i = 0; i < mip.width; i++) this.samples[offset++] = view.getUint16(i * 2, true);
            }
        }
        if (this._textureIndex < 0)
        {
            let index = Tr2LightProfileRes.profiles.indexOf(null);
            if (index < 0) index = Tr2LightProfileRes.profiles.length;
            if (index >= 4095) throw new ErrResourceFormatInvalid({ format: "light profile array is full" });
            this._textureIndex = index;
        }
        Tr2LightProfileRes.profiles[this._textureIndex] = this;
        Tr2LightProfileRes.revision++;
        this.OnPrepared();
    }

    GetTextureIndex()
    {
        this.KeepAlive();
        return this.IsGood() ? this._textureIndex : -1;
    }

    Unload(log)
    {
        if (this._textureIndex >= 0) Tr2LightProfileRes.profiles[this._textureIndex] = null;
        this._textureIndex = -1;
        this.samples = null;
        Tr2LightProfileRes.revision++;
        this.OnUnloaded(log);
        return true;
    }

    /** Carbon's rotationally symmetric parser uses the first horizontal slice. */
    static ParseIes(text)
    {
        const tilt = /TILT\s*=\s*([^\n]*)\n/.exec(text);
        if (!tilt || tilt[1].trim() !== "NONE")
        {
            throw new ErrResourceFormatInvalid({ format: "IES: expected TILT=NONE" });
        }
        const values = text.slice(tilt.index + tilt[0].length).trim().split(/\s+/).map(Number);
        const verticalCount = values[3], horizontalCount = values[4];
        if (!Number.isInteger(verticalCount) || verticalCount < 1 || !Number.isInteger(horizontalCount)
            || horizontalCount < 1 || values.length < 13 + 2 * verticalCount + horizontalCount
            || values.slice(0, 13 + 2 * verticalCount + horizontalCount).some(value => !Number.isFinite(value)))
        {
            throw new ErrResourceFormatInvalid({ format: "IES: invalid angle/intensity table" });
        }
        const angles = values.slice(13, 13 + verticalCount);
        const intensities = values.slice(13 + verticalCount + horizontalCount, 13 + 2 * verticalCount + horizontalCount);
        let maximum = 0;
        for (const value of intensities) maximum = Math.max(maximum, value);
        const samples = new Uint16Array(2048);
        for (let i = 0; i < 1024; i++)
        {
            const angle = Math.acos(1 - 2 * i / 1024) * 180 / Math.PI;
            for (let j = 0; j < verticalCount - 1; j++)
            {
                if (angle >= angles[j] && angle <= angles[j + 1])
                {
                    const t = (angle - angles[j]) / (angles[j + 1] - angles[j]);
                    const value = intensities[j] + (intensities[j + 1] - intensities[j]) * t;
                    samples[i] = num.toHalfFloat(maximum > 0 ? value / maximum : value);
                    break;
                }
            }
        }
        let previous = 0, offset = 1024;
        for (let width = 512; width > 0; width >>= 1)
        {
            for (let i = 0; i < width; i++)
            {
                samples[offset + i] = num.toHalfFloat((num.fromHalfFloat(samples[previous + i * 2])
                    + num.fromHalfFloat(samples[previous + i * 2 + 1])) * 0.5);
            }
            previous = offset;
            offset += width;
        }
        return samples;
    }
}
