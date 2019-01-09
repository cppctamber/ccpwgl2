import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataGeneric
 *
 * @parameter {String} areaShaderLocation                               -
 * @parameter {Array.<EveSOFDataGenericShader>} areaShaders             -
 * @parameter {EveSOFDataGenericShader} bannerShader                    -
 * @parameter {EveSOFDataGenericDamage} damage                          -
 * @parameter {String} decalShaderLocation                              -
 * @parameter {Array.<EveSOFDataGenericDecalShader>} decalShaders       -
 * @parameter {EveSOFDataAreaMaterial} genericWreckMaterial             -
 * @parameter {EveSOFDataGenericHullDamage} hullDamage                  -
 * @parameter {Array.<EveSOFDataGenericString>} materialPrefixes        -
 * @parameter {Array.<EveSOFDataGenericString>} patternMaterialPrefixes -
 * @parameter {String} resPathDefaultAlliance                           -
 * @parameter {String} resPathDefaultCeo                                -
 * @parameter {String} resPathDefaultCorp                               -
 * @parameter {String} shaderPrefixAnimated                             -
 * @parameter {EveSOFDataGenericSwarm} swarm                            -
 * @parameter {Array.<EveSOFDataGenericVariant>} variants               -
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

