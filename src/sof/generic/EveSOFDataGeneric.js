import { Tw2Error } from "core";
import { meta } from "global";


@meta.ctor("EveSOFDataGeneric", true)
export class EveSOFDataGeneric
{

    @meta.path
    areaShaderLocation = "";

    @meta.list("EveSOFDataGenericShader")
    areaShaders = [];

    @meta.raw("EveSOFDataGenericShader")
    bannerShader = null;

    @meta.struct("EveSOFDataGenericDamage")
    damage = null;

    @meta.path
    decalShaderLocation = "";

    @meta.list("EveSOFDataGenericDecalShader")
    decalShaders = [];

    @meta.struct("EveSOFDataAreaMaterial")
    genericWreckMaterial = null;

    @meta.struct("EveSOFDataGenericHullDamage")
    hullDamage = null;

    @meta.list("EveSOFDataGenericString")
    materialPrefixes = [];

    @meta.list("EveSOFDataGenericString")
    patternMaterialPrefixes = [];

    @meta.path
    resPathDefaultAlliance = "";

    @meta.path
    resPathDefaultCeo = "";

    @meta.path
    resPathDefaultCorp = "";

    @meta.string
    shaderPrefixAnimated = "";

    @meta.struct("EveSOFDataGenericSwarm")
    swarm = null;

    @meta.list("EveSOFDataGenericVariant")
    variants = [];

    @meta.list("EveSOFDataGenericString")
    visibilityGroups = [];

}

/**
 * Fires when a sof area shader is not found
 */
export class ErrSOFAreaShaderNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Area shader not found: %name%");
    }
}

/**
 * Fires when a sof decal shader is not found
 */
export class ErrSOFDecalShaderNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Decal area shader not found: %name%");
    }
}

/**
 * Fires when a sof material prefix is not found
 */
export class ErrSOFMaterialPrefixNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Material prefix index not found: %index%");
    }
}

/**
 * Fires when a sof pattern material prefix is not found
 */
export class ErrSOFPatternMaterialPrefixNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Pattern material prefix index not found: %index%");
    }
}
