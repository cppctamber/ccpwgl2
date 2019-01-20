import {Tw2BaseClass} from "../../global";

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
export default class EveSOFDataGeneric extends Tw2BaseClass
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

Tw2BaseClass.define(EveSOFDataGeneric, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataGeneric",
        props: {
            areaShaderLocation: Type.STRING,
            areaShaders: [["EveSOFDataGenericShader"]],
            bannerShader: ["EveSOFDataGenericShader"],
            damage: ["EveSOFDataGenericDamage"],
            decalShaderLocation: Type.STRING,
            decalShaders: [["EveSOFDataGenericDecalShader"]],
            genericWreckMaterial: ["EveSOFDataAreaMaterial"],
            hullDamage: ["EveSOFDataGenericHullDamage"],
            materialPrefixes: [["EveSOFDataGenericString"]],
            patternMaterialPrefixes: [["EveSOFDataGenericString"]],
            resPathDefaultAlliance: Type.PATH,
            resPathDefaultCeo: Type.PATH,
            resPathDefaultCorp: Type.PATH,
            shaderPrefixAnimated: Type.STRING,
            swarm: ["EveSOFDataGenericSwarm"],
            variants: [["EveSOFDataGenericVariant"]]
        }
    };
});

