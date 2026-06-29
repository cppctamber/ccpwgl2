import { meta } from "utils";


@meta.type("EveSOFDataBlinkType")
@meta.define({
    wgl: "EveSOFDataBlinkType",
    ccp: true
})
export class EveSOFDataBlinkType extends meta.Model
{

    @meta.struct("EveSOFDataBlink")
    Static = null;

    @meta.struct("EveSOFDataBlink")
    Blink = null;

    @meta.struct("EveSOFDataBlink")
    FadeIn = null;

    @meta.struct("EveSOFDataBlink")
    FadeOut = null;

    @meta.struct("EveSOFDataBlink")
    Cycle = null;

    /**
     * Gets blink data by Carbon enum index.
     * @param {number} type
     * @returns {EveSOFDataBlink|null}
     */
    GetByType(type)
    {
        return this[this.constructor.Types[type]] || null;
    }

    static Type = {
        STATIC: 0,
        BLINK: 1,
        FADE_IN: 2,
        FADE_OUT: 3,
        CYCLE: 4
    };

    static Types = [
        "Static",
        "Blink",
        "FadeIn",
        "FadeOut",
        "Cycle"
    ];

}
