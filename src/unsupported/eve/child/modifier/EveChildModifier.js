import { meta } from "utils";
import { mat4 } from "math";


@meta.type("EveChildModifier")
@meta.define({
    wgl: "EveChildModifier",
    ccp: true
})
export class EveChildModifier extends meta.Model
{

    static global = {
        mat4_0: mat4.create()
    }

    /**
     * Gets joint matrices from temporary child update data or legacy packed per-object data.
     * @param {Object|Tw2PerObjectData} parentData
     * @returns {Float32Array|Array|null}
     */
    static GetJointMatrices(parentData)
    {
        if (!parentData) return null;
        if (parentData.jointMatrices) return parentData.jointMatrices;
        if (parentData.perObjectData) return this.GetJointMatrices(parentData.perObjectData);

        const vs = parentData.vs;
        if (vs && typeof vs.Has === "function" && vs.Has("JointMat"))
        {
            return vs.Get("JointMat");
        }

        return null;
    }

}
