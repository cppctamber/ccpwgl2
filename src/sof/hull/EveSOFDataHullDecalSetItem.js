import { vec3, quat, meta } from "global";


@meta.type("EveSOFDataHullDecalSetItem", true)
export class EveSOFDataHullDecalSetItem
{

    @meta.black.string
    name = "";

    @meta.black.uint
    boneIndex = -1;

    @meta.black.indexBuffer
    indexBuffer = [];

    @meta.black.uint
    glowColorType = 0;

    @meta.black.uint
    logoType = 0;

    @meta.black.uint
    meshIndex = 0;

    @meta.black.listOf("EveSOFDataParameter")
    parameters = [];

    @meta.black.vector3
    position = vec3.create();

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.black.listOf("EveSOFDataTexture")
    textures = [];

    @meta.black.uint
    usage = 0;

    @meta.black.string
    visibilityGroup = "";


    /**
     * Assigns the hull decal set's parameters
     * @param {Object} [out={}]
     * @returns {Object} out
     */
    Assign(out={})
    {
        out.parameters = this.AssignParameters(out.parameters);
        out.textures = this.AssignTextures(out.textures);
        return out;
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
    AssignTextures(out={})
    {
        for (let i = 0; i < this.textures.length; i++)
        {
            this.textures[i].Assign(out);
        }
        return out;
    }

}
