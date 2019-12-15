import { meta, vec4 } from "global";


@meta.type("EveSOFDataFactionColorSet")
export class EveSOFDataFactionColorSet
{

    @meta.black.color
    Black = vec4.create();

    @meta.black.color
    Blue = vec4.create();

    @meta.black.color
    Booster = vec4.create();

    @meta.black.color
    Cyan = vec4.create();

    @meta.black.color
    Darkhull = vec4.create();

    @meta.black.color
    Fire = vec4.create();

    @meta.black.color
    Glass = vec4.create();

    @meta.black.color
    Green = vec4.create();

    @meta.black.color
    Hull = vec4.create();

    @meta.black.color
    Killmark = vec4.create();

    @meta.black.color
    Orange = vec4.create();

    @meta.black.color
    Primary = vec4.create();

    @meta.black.color
    PrimaryLight = vec4.create();

    @meta.black.color
    Reactor = vec4.create();

    @meta.black.color
    Red = vec4.create();

    @meta.black.color
    Secondary = vec4.create();

    @meta.black.color
    SecondaryLight = vec4.create();

    @meta.black.color
    Tertiary = vec4.create();

    @meta.black.color
    TertiaryLight = vec4.create();

    @meta.black.color
    White = vec4.create();

    @meta.black.color
    WhiteLight = vec4.create();

    @meta.black.color
    Yellow = vec4.create();


    /**
     * Gets a faction color set by name
     * @param {String} name
     * @param {vec4} out
     * @returns {vec4|null}
     */
    Get(name, out)
    {
        name = name.toUpperCase();

        for (const key in this)
        {
            if (this.hasOwnProperty(key) && key.toUpperCase() === name)
            {
                vec4.copy(out, this[name]);
                return out;
            }
        }

        vec4.set(out, 0, 0, 0, 0);
        return null;
    }

}
