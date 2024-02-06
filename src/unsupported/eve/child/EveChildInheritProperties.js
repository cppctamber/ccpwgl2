import { meta } from "utils";
import { vec4 } from "math/vec4";


@meta.notImplemented
@meta.type("EveChildInheritProperties")
export class EveChildInheritProperties extends meta.Model
{

    /*

        These should all be references to a hull's faction's colours
        and some other stuff...

     */

    @meta.color
    Black = vec4.create();

    @meta.color
    Blue = vec4.create();

    @meta.color
    Booster = vec4.create();

    @meta.color
    Cyan = vec4.create();

    @meta.color
    Darkhull = vec4.create();

    @meta.color
    Fire = vec4.create();

    @meta.color
    Glass = vec4.create();

    @meta.color
    Green = vec4.create();

    @meta.color
    Hull = vec4.create();

    @meta.color
    Killmark = vec4.create();

    @meta.color
    Orange = vec4.create();

    @meta.color
    Primary = vec4.create();

    @meta.color
    PrimaryLight = vec4.create();

    @meta.color
    Reactor = vec4.create();

    @meta.color
    Red = vec4.create();

    @meta.color
    Secondary = vec4.create();

    @meta.color
    SecondaryLight = vec4.create();

    @meta.color
    Tertiary = vec4.create();

    @meta.color
    TertiaryLight = vec4.create();

    @meta.color
    White = vec4.create();

    @meta.color
    WhiteLight = vec4.create();

    @meta.color
    Yellow = vec4.create();

    @meta.color
    PrimarySpotlight = vec4.create();

    @meta.color
    SecondarySpotlight = vec4.create();

    @meta.color
    TertiarySpotlight = vec4.create();

    @meta.color
    PrimaryHologram = vec4.create();

    @meta.color
    SecondaryHologram = vec4.create();

    @meta.color
    TertiaryHologram = vec4.create();

    @meta.color
    State0 = vec4.create();

    @meta.color
    State1 = vec4.create();

    @meta.color
    State2 = vec4.create();

    @meta.color
    State3 = vec4.create();

    @meta.color
    StateVulnerable = vec4.create();

    @meta.color
    StateInvulnerable = vec4.create();

    @meta.color
    PrimaryForcefield = vec4.create();

    @meta.color
    SecondaryForcefield = vec4.create();

    @meta.color
    PrimaryBanner = vec4.create();

    @meta.color
    PrimaryBillboard = vec4.create();

    @meta.color
    PrimaryFx = vec4.create();

    @meta.color
    SecondaryFx = vec4.create();

}
