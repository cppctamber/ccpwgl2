import { meta } from "utils";
import { quat, vec3 } from "math";
import { ErrIndexBounds } from "core";


@meta.type("EveSOFDataHullDecalSetItem")
export class EveSOFDataHullDecalSetItem extends meta.Model
{

    @meta.string
    name = "";

    @meta.uint
    boneIndex = -1;

    @meta.list()
    indexBuffers = [];

    @meta.uint
    glowColorType = 0;

    @meta.uint
    logoType = 0;

    @meta.uint
    meshIndex = 0;

    @meta.list("EveSOFDataParameter")
    parameters = [];

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.list("EveSOFDataTexture")
    textures = [];

    @meta.uint
    usage = 0;

    @meta.string
    visibilityGroup = "";

    // Backwards compatibility with old sofs
    @meta.uint16Array
    indexBuffer = null;

    /**
     * Gets the decals index buffer array
     * @returns {Array}
     */
    GetIndexBuffers()
    {
        if (this.indexBuffer && this.indexBuffer.length)
        {
            return [ Array.from(this.indexBuffer) ];
        }
        else
        {
            return this.indexBuffers.map(x => Array.from(x.indexBuffer));
        }
    }

    /**
     * Assigns the object's textures and parameters to an effect config
     * @param {Object} config={}]
     * @returns {Object} config
     */
    Assign(config = {})
    {
        config.textures = this.AssignTextures(config.textures);
        config.parameters = this.AssignParameters(config.parameters);
        return config;
    }

    /**
     * Assigns parameters to an object
     * @param {Object} [out={}]
     */
    AssignParameters(out = {})
    {
        for (let i = 0; i < this.parameters.length; i++)
        {
            this.parameters[i].Assign(out);
        }
        return out;
    }

    /**
     * Assigns parameters to an object
     * @param {Object} [out={}]
     */
    AssignTextures(out = {})
    {
        for (let i = 0; i < this.textures.length; i++)
        {
            this.textures[i].Assign(out);
        }
        return out;
    }

}
