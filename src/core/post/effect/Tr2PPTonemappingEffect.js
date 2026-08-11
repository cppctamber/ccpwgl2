import { meta } from "utils";
import { Tr2PPEffect } from "./Tr2PPEffect";


const Method = Object.freeze({
    UNCHARTED2: 0,
    ACES: 1,
    AGX: 2
});


/**
 * Tone curve selection and its shaping parameters
 *
 * Carbon nests these in two structs (`m_aces`, `m_uncharted2`) but Blue exposes
 * them flat, in one namespace, so that is how they hydrate. Porting from the
 * C++ header rather than the Blue exposure produces a class that silently fails
 * to read shipped data.
 *
 * ACES and AgX belong to Frontier; EVE ships the Uncharted2 curve, and no EVE
 * build's compiled composite contains an ACES path at all. `method` therefore
 * selects something the EVE shader cannot honour — see the org documentation on
 * Carbon's scene composite pass before assuming otherwise.
 *
 * @ccp Tr2PPTonemappingEffect
 */
@meta.type("Tr2PPTonemappingEffect")
@meta.ccp.define("Tr2PPTonemappingEffect")
export class Tr2PPTonemappingEffect extends Tr2PPEffect
{

    @meta.enums(Method)
    method = Method.ACES;

    // Aces (Frontier)

    @meta.float
    slope = 0.88;

    @meta.float
    toe = 0.55;

    @meta.float
    shoulder = 0.26;

    @meta.float
    blackClip = 0;

    @meta.float
    whiteClip = 0.04;

    @meta.float
    scale = 1;

    @meta.float
    blueCorrection = 0;

    @meta.boolean
    useSweeteners = true;

    // Uncharted 2 (Eve)

    @meta.float
    shoulderStrength = 0.125;

    @meta.float
    linearStrength = 0.25;

    @meta.float
    linearAngle = 0.1;

    @meta.float
    toeStrength = 0.15;

    @meta.float
    toeNumerator = 0.021;

    @meta.float
    toeDenominator = 0.3;

    @meta.float
    whiteScale = 2.5;

    static Method = Method;

}
