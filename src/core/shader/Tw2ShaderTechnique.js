import { isArray, meta, toArray } from "utils";
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
     *
     * TODO: Replace with util functions
     * @param {Object} json
     * @param {Tw2EffectRes} context
     * @param {String} key
     * @return {Tw2ShaderTechnique}
     */
    static fromJSON(json, context, key)
    {
        let { name = key, passes, vertex, fragment } = json;

        const technique = new Tw2ShaderTechnique();
        technique.name = name;

        // Allow skipping passes array when there is only one
        if (!passes)
        {
            if (vertex && fragment)
            {
                passes = [ { vertex, fragment } ];
            }
            else
            {
                throw new ReferenceError(`Shader has no program: ${context.path}`);
            }
        }

        for (let i = 0; i < passes.length; i++)
        {
            technique.passes.push(Tw2ShaderPass.fromJSON(passes[i], context));
        }

        return technique;
    }

    /**
     * Reads ccp shader techniques binary
     * @param {Tw2BinaryReader} reader
     * @param {Tw2EffectRes}  context
     * @param {String} name
     * @returns {Tw2ShaderTechnique}
     */
    static fromCCPBinary(reader, context, name)
    {
        const technique = new Tw2ShaderTechnique();
        technique.name = name;

        const passCount = reader.ReadUInt8();
        for (let i = 0; i < passCount; i++)
        {
            technique.passes.push(Tw2ShaderPass.fromCCPBinary(reader, context));
        }

        return technique;
    }

}
