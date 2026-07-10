import { meta } from "utils";
import { EveChildModifier } from "./EveChildModifier";
import { Billboard2D } from "./EveChildModifierTransformCommon";


/**
 * EveChildModifierBillboard2D
 *
 * Source: carbonengine trinity/trinity/Eve/SpaceObject/Children/TransformModifiers/
 * EveChildModifierBillboard2D.h/.cpp (no persisted properties;
 * EveChildModifierBillboard2D_Blue.cpp's ExposeToBlue() only maps the interface).
 */
@meta.notImplemented
@meta.type("EveChildModifierBillboard2D")
@meta.define({
    wgl: "EveChildModifierBillboard2D",
    ccp: true
})
export class EveChildModifierBillboard2D extends EveChildModifier
{

    /**
     * Applies this modifier's transform, mutating `transform` in place
     *
     * Reproduces `EveChildModifierBillboard2D::ApplyTransform`
     * (EveChildModifierBillboard2D.cpp:15-18), which just forwards to the
     * shared `Billboard2D` helper.
     * @param {mat4} transform
     * @returns {mat4}
     */
    ApplyTransform(transform)
    {
        return Billboard2D(transform);
    }

}
