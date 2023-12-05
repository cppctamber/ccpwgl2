import { meta } from "utils";
import { EveSOFDataParameter, EveSOFDataTexture } from "sof";


@meta.type("EveSOFDataRaceDamage")
export class EveSOFDataRaceDamage extends meta.Model
{

    @meta.list("EveSOFDataParameter")
    armorImpactParameters = [];

    @meta.list("EveSOFDataTexture")
    armorImpactTextures = [];

    @meta.list("EveSOFDataParameter")
    shieldImpactParameters = [];

    @meta.list("EveSOFDataTexture")
    shieldImpactTextures = [];


    /**
     * Assigns armour textures and parameters to an object
     * @param {Object} [out={}]
     * @returns {Object}
     */
    AssignArmor(out = {})
    {
        out.parameters = out.parameters || {};
        out.textures = out.textures || {};

        for (let i = 0; i < this.armorImpactParameters.length; i++)
        {
            this.armorImpactParameters[i].Assign(out.parameters);
        }

        for (let i = 0; i < this.armorImpactTextures.length; i++)
        {
            this.armorImpactTextures[i].Assign(out.textures);
        }

        return out;
    }

    /**
     * Assigns shield textures and parameters to an object
     * @param {Object} [out={}]
     * @returns {Object}
     */
    AssignShield(out = {})
    {
        out.parameters = out.parameters || {};
        out.textures = out.textures || {};

        for (let i = 0; i < this.shieldImpactParameters.length; i++)
        {
            this.shieldImpactParameters[i].Assign(out.parameters);
        }

        for (let i = 0; i < this.shieldImpactTextures.length; i++)
        {
            this.shieldImpactTextures[i].Assign(out.textures);
        }

        return out;
    }

    /**
     *
     * @param {EveSOFDataRaceDamage} a
     * @param {EveSOFDataRaceDamage} b
     * @param {EveSOFDataRaceDamage} [out]
     * @returns {EveSOFDataRaceDamage}
     */
    static combine(a, b, out)
    {
        out = out || new this();
        if (!a) a = out;
        EveSOFDataTexture.combineArrays(a.armorImpactTextures, b ? b.armorImpactTextures : null, out.armorImpactTextures);
        EveSOFDataTexture.combineArrays(a.shieldImpactTextures, b ? b.shieldImpactTextures : null, out.shieldImpactTextures);
        EveSOFDataParameter.combineArrays(a.armorImpactParameters, b ? b.armorImpactParameters : null, out.armorImpactParameters);
        EveSOFDataParameter.combineArrays(a.shieldImpactParameters, b ? b.shieldImpactParameters : null, out.shieldImpactParameters);
        return out;
    }

}
