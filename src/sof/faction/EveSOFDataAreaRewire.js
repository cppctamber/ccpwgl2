import { meta } from "utils";
import { vec4 } from "math";
import { EveSOFDataFaction } from "sof";


@meta.type("EveSOFDataAreaRewire")
export class EveSOFDataAreaRewire extends meta.Model
{

    @meta.string
    name = null;

    @meta.vector4
    materialIndices = vec4.create();

    @meta.string
    respathInsert = "";

    /**
     * Rewires a respath insert if the provided race matches the rewire name
     * @param {string} race
     * @param {string} [originalRespathInsert=""]
     * @returns {string}
     */
    GetRewiredRespathInsert(race, originalRespathInsert = "")
    {
        console.log(`Trying to rewire race ${race} respathinsert (${originalRespathInsert})`);
        if (race.toLowerCase() === this.name.toLowerCase() && this.respathInsert)
        {
            console.log(`Rewired hull respathinsert (${this.respathInsert})`);
            return this.respathInsert;
        }
        return originalRespathInsert;
    }

    /**
     * Rewires an effect's material parameters if the provided race matches the rewire name
     * @param {String} race
     * @param {Tw2Effect|Object} effect
     * @returns {boolean}
     */
    RewireEffectMaterials(race, effect)
    {
        if (race.toLowerCase() !== this.name.toLowerCase()) return false;

        // Don't apply rewiring until the very end
        const
            rewired = {},
            parameters = effect.GetParameters();

        for (const key in parameters)
        {
            if (parameters.hasOwnProperty(key) && key.indexOf("Mtl") === 0)
            {
                const index = Number(key.substring(3, 4)) - 1;
                const parameter = key.substring(4);
                if (this.materialIndices[index] !== 0)
                {
                    rewired[`Mtl${this.materialIndices[index]}${parameter}`] = parameters[key];
                }
            }
        }

        if (Object.keys(rewired).length)
        {
            console.debug(rewired);
            effect.SetParameters(rewired);
            return true;
        }

        return false;
    }

    /**
     *
     * @param {Array<EveSOFDataAreaRewire>} [a=[]]
     * @param {Array<EveSOFDataAreaRewire>} [b=[]]
     * @param {Array<EveSOFDataAreaRewire>} [out=[]]
     * @returns {Array<EveSOFDataAreaRewire>}
     */
    static combineArrays(a = [], b = [], out = [])
    {
        out.splice(0);

        function combine(src)
        {
            for (let i = 0; i < src.length; i++)
            {
                let found = out.find(x => x.name === src[i].name);
                if (!found)
                {
                    found = new EveSOFDataAreaRewire();
                    found.name = src[i].name;
                    out.push(found);
                }

                if (src[i].materialIndices) vec4.copy(found.materialIndices, src[i].materialIndices);
                found.respathInsert = src[i].respathInsert || "";
            }
        }

        combine(a);
        combine(b);

        return out;
    }
}


/**
 *
 * @param {string} race
 * @param {string} originalRespathInsert
 * @returns {string}
 */
EveSOFDataFaction.prototype.GetRewiredRespathInsert = function (race, originalRespathInsert = "")
{
    if (!this.rewires) this.rewires = [];
    race = race.toLowerCase();
    const rewire = this.rewires.find(x => x.name.toLowerCase() === race);
    return rewire ? rewire.GetRewiredRespathInsert(race, originalRespathInsert) : originalRespathInsert;
};

/**
 *
 * @param {string} race
 * @param {string} originalRespathInsert
 * @returns {string}
 */
EveSOFDataFaction.prototype.RewireEffectMaterials = function (race, effect)
{
    if (!this.rewires) this.rewires = [];
    race = race.toLowerCase();
    const rewire = this.rewires.find(x => x.name.toLowerCase() === race);
    return rewire ? rewire.RewireEffectMaterials(race, effect) : false;
};


let originalCombine = EveSOFDataFaction.combine;

/**
 *
 * @param a
 * @param b
 * @param out
 * @returns {EveSOFDataFaction|null}
 */
EveSOFDataFaction.combine = function (a, b, out)
{
    out = originalCombine(a, b, out);
    out.rewires = EveSOFDataAreaRewire.combineArrays(a.rewires, b.rewires, out.rewires);
    return out;
};