import { vec4 } from "../../global";


/**
 * EveSOFDataBooster
 *
 * @property {vec4} glowColor                    -
 * @property {Number} glowScale                  -
 * @property {String} gradient0ResPath           -
 * @property {String} gradient1ResPath           -
 * @property {vec4} haloColor                    -
 * @property {Number} haloScaleX                 -
 * @property {Number} haloScaleY                 -
 * @property {vec4} lightColor                   -
 * @property {Number} lightFlickerAmplitude      -
 * @property {Number} lightFlickerFrequency      -
 * @property {Number} lightRadius                -
 * @property {vec4} lightWarpColor               -
 * @property {Number} lightWarpRadius            -
 * @property {EveSOFDataBoosterShape} shape0     -
 * @property {EveSOFDataBoosterShape} shape1     -
 * @property {Number} shapeAtlasCount            -
 * @property {Number} shapeAtlasHeight           -
 * @property {String} shapeAtlasResPath          -
 * @property {Number} symHaloScale               -
 * @property {vec4} trailColor                   -
 * @property {vec4} trailSize                    -
 * @property {vec4} warpGlowColor                -
 * @property {vec4} warpHaloColor                -
 * @property {EveSOFDataBoosterShape} warpShape0 -
 * @property {EveSOFDataBoosterShape} warpShape1 -
 */
export class EveSOFDataBooster
{

    glowColor = vec4.create();
    glowScale = 0;
    gradient0ResPath = "";
    gradient1ResPath = "";
    haloColor = vec4.create();
    haloScaleX = 0;
    haloScaleY = 0;
    lightColor = vec4.create();
    lightFlickerAmplitude = 0;
    lightFlickerFrequency = 0;
    lightRadius = 0;
    lightWarpColor = vec4.create();
    lightWarpRadius = 0;
    shape0 = null;
    shape1 = null;
    shapeAtlasCount = 0;
    shapeAtlasHeight = 0;
    shapeAtlasResPath = "";
    symHaloScale = 0;
    trailColor = vec4.create();
    trailSize = vec4.create();
    warpGlowColor = vec4.create();
    warpHaloColor = vec4.create();
    warpShape0 = null;
    warpShape1 = null;

    /**
     * Alias for `warpHaloColor` (ccp typo)
     * @returns {vec4}
     */
    get warpHalpColor()
    {
        return this.warpHaloColor;
    }

    /**
     * Alias for `warpHaloColor` (ccp typo)
     * @param {vec4} v
     */
    set warpHalpColor(v)
    {
        this.warpHaloColor = v;
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "glowColor", r.vector4 ],
            [ "glowScale", r.float ],
            [ "gradient0ResPath", r.path ],
            [ "gradient1ResPath", r.path ],
            [ "haloColor", r.vector4 ],
            [ "haloScaleX", r.float ],
            [ "haloScaleY", r.float ],
            [ "lightFlickerAmplitude", r.float ],
            [ "lightFlickerColor", r.vector4 ],
            [ "lightFlickerFrequency", r.float ],
            [ "lightFlickerRadius", r.float ],
            [ "lightColor", r.vector4 ],
            [ "lightRadius", r.float ],
            [ "lightWarpColor", r.vector4 ],
            [ "lightWarpRadius", r.float ],
            [ "shape0", r.object ],
            [ "shape1", r.object ],
            [ "shapeAtlasCount", r.uint ],
            [ "shapeAtlasHeight", r.uint ],
            [ "shapeAtlasResPath", r.path ],
            [ "shapeAtlasWidth", r.uint ],
            [ "symHaloScale", r.float ],
            [ "trailColor", r.vector4 ],
            [ "trailSize", r.vector4 ],
            [ "volumetric", r.boolean ],
            [ "warpGlowColor", r.vector4 ],
            [ "warpHalpColor", r.vector4 ],
            [ "warpShape0", r.object ],
            [ "warpShape1", r.object ]
        ];
    }
}
