import { meta } from "utils";


@meta.ctor("EveSOFDataRaceDamage")
export class EveSOFDataRaceDamage
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

        for (let i = 0; i < this.armorImpactParameters; i++)
        {
            this.armorImpactParameters[i].Assign(out.parameters);
        }

        for (let i = 0; i < this.armorImpactTextures; i++)
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

        for (let i = 0; i < this.shieldImpactParameters; i++)
        {
            this.shieldImpactParameters[i].Assign(out.parameters);
        }

        for (let i = 0; i < this.shieldImpactTextures; i++)
        {
            this.shieldImpactTextures[i].Assign(out.textures);
        }

        return out;
    }

}
