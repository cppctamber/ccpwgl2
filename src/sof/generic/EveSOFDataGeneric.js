import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataGeneric
 *
 * @property {String} areaShaderLocation                               -
 * @property {Array.<EveSOFDataGenericShader>} areaShaders             -
 * @property {EveSOFDataGenericShader} bannerShader                    -
 * @property {EveSOFDataGenericDamage} damage                          -
 * @property {String} decalShaderLocation                              -
 * @property {Array.<EveSOFDataGenericDecalShader>} decalShaders       -
 * @property {EveSOFDataAreaMaterial} genericWreckMaterial             -
 * @property {EveSOFDataGenericHullDamage} hullDamage                  -
 * @property {Array.<EveSOFDataGenericString>} materialPrefixes        -
 * @property {Array.<EveSOFDataGenericString>} patternMaterialPrefixes -
 * @property {String} resPathDefaultAlliance                           -
 * @property {String} resPathDefaultCeo                                -
 * @property {String} resPathDefaultCorp                               -
 * @property {String} shaderPrefixAnimated                             -
 * @property {EveSOFDataGenericSwarm} swarm                            -
 * @property {Array.<EveSOFDataGenericVariant>} variants               -
 */
export class EveSOFDataGeneric extends EveSOFBaseClass
{

    areaShaderLocation = "";
    areaShaders = [];
    bannerShader = null;
    damage = null;
    decalShaderLocation = "";
    decalShaders = [];
    genericWreckMaterial = null;
    hullDamage = null;
    materialPrefixes = [];
    patternMaterialPrefixes = [];
    resPathDefaultAlliance = "";
    resPathDefaultCeo = "";
    resPathDefaultCorp = "";
    shaderPrefixAnimated = "";
    swarm = null;
    variants = [];

}

EveSOFDataGeneric.define(r =>
{
    return {
        type: "EveSOFDataGeneric",
        black: [
            ["areaShaderLocation", r.string],
            ["areaShaders", r.array],
            ["bannerShader", r.plain],
            ["decalShaderLocation", r.string],
            ["decalShaders", r.array],
            ["damage", r.object],
            ["genericWreckMaterial", r.object],
            ["hullAreas", r.array],
            ["hullDamage", r.object],
            ["materialPrefixes", r.array],
            ["patternMaterialPrefixes", r.array],
            ["resPathDefaultAlliance", r.path],
            ["resPathDefaultCeo", r.path],
            ["resPathDefaultCorp", r.path],
            ["shaderPrefixAnimated", r.string],
            ["swarm", r.object],
            ["variants", r.array],
        ]
    };
});