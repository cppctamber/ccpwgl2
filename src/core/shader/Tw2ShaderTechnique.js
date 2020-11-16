import { meta } from "utils";
import { Tw2ShaderPass } from "./Tw2ShaderPass";


@meta.type("Tw2ShaderTechnique")
export class Tw2ShaderTechnique
{

    @meta.string
    name = "";

    @meta.list("Tw2ShaderPass")
    passes = [];

    /**
     * Checks if a technique has a constant
     * @param {String} name
     * @return {boolean}
     */
    HasConstant(name)
    {
        for (let i = 0; i < this.passes.length; i++)
        {
            if (this.passes[i].HasConstant(name))
            {
                return true;
            }
        }

        return false;
    }

    /**
     * Checks if a technique has a texture
     * @param {String} name
     * @return {boolean}
     */
    HasTexture(name)
    {
        for (let i = 0; i < this.passes.length; i++)
        {
            if (this.passes[i].HasTexture(name))
            {
                return true;
            }
        }

        return false;
    }

    /**
     * Checks if a technique has a sampler
     * @param {String} name
     * @return {boolean}
     */
    HasSampler(name)
    {
        for (let i = 0; i < this.passes.length; i++)
        {
            if (this.passes[i].HasSampler(name))
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Reads ccp shader techniques binary
     * @param {Tw2BinaryReader} reader
     * @param {Tw2EffectRes}  res
     * @param {String} name
     * @returns {Tw2ShaderTechnique}
     */
    static fromCCPBinary(reader, res, name)
    {
        const technique = new Tw2ShaderTechnique();
        technique.name = name;

        const passCount = reader.ReadUInt8();
        for (let i = 0; i < passCount; i++)
        {
            technique.passes.push(Tw2ShaderPass.fromCCPBinary(reader, res));
        }

        return technique;
    }


}
