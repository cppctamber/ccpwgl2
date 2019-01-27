import {vec3, quat, mat4, Tw2BaseClass} from "../../global";
import {Tw2PerObjectData, Tw2RawData} from "../../core";
import {EveChild} from "./EveChild";

/**
 * Mesh attachment to space object
 * TODO: Implement "lowestLodVisible"
 * TODO: Implement "minScreenSize"
 * TODO: Implement "sortValueOffset"
 * TODO: Implement "staticTransform"
 * TODO: Implement "transformModifiers"
 * @ccp EveChildMesh
 *
 * @property {Boolean} display                          -
 * @property {mat4} localTransform                      -
 * @property {Number} lowestLodVisible                  -
 * @property {Tw2Mesh|Tw2InstancedMesh} mesh                                -
 * @property {Number} minScreenSize                     -
 * @property {quat} rotation                            -
 * @property {vec3} scaling                             -
 * @property {Number} sortValueOffset                   -
 * @property {Boolean} staticTransform                  -
 * @property {Array.<ChildModifier>} transformModifiers -
 * @property {vec3} translation                         -
 * @property {Boolean} useSRT                           -
 * @property {Boolean} useSpaceObjectData               -
 * @property {mat4} _worldTransform                     -
 * @property {mat4} _worldTransformLast                 -
 * @property {Tw2PerObjectData} _perObjectData          -
 */
export class EveChildMesh extends EveChild
{

    display = true;
    localTransform = mat4.create();
    lowestLodVisible = 2;
    mesh = null;
    minScreenSize = 0;
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    sortValueOffset = 0;
    staticTransform = false;
    transformModifiers = [];
    translation = vec3.create();
    useSRT = true;
    useSpaceObjectData = true;

    // ccp
    _worldTransform = mat4.create();
    _worldTransformLast = mat4.create();
    _perObjectData = null;

    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     */
    Update(dt, parentTransform)
    {
        if (this.useSRT)
        {
            quat.normalize(this.rotation, this.rotation);
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }

        /*
        for (let i = 0; i < this.transformModifiers.length; i++)
        {
            this.transformModifiers.Update(dt, this.localTransform);
        }
        */

        mat4.copy(this._worldTransformLast, this._worldTransform);
        mat4.multiply(this._worldTransform, parentTransform, this.localTransform);
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this.mesh) return;

        if (this.useSpaceObjectData)
        {
            if (!this._perObjectData)
            {
                this._perObjectData = new Tw2PerObjectData();
                this._perObjectData.vs = new Tw2RawData();
                this._perObjectData.vs.data = new Float32Array(perObjectData.vs.data.length);

                this._perObjectData.vs.data[33] = 1;
                this._perObjectData.vs.data[35] = 1;

                this._perObjectData.ps = new Tw2RawData();
                this._perObjectData.ps.data = new Float32Array(perObjectData.ps.data.length);

                this._perObjectData.ps.data[1] = 1;
                this._perObjectData.ps.data[3] = 1;
            }

            this._perObjectData.vs.data.set(perObjectData.vs.data);
            this._perObjectData.ps.data.set(perObjectData.ps.data);
            mat4.transpose(this._perObjectData.vs.data, this._worldTransform);
            mat4.transpose(this._perObjectData.vs.data.subarray(16), this._worldTransformLast);
        }
        else
        {
            if (!this._perObjectData)
            {
                this._perObjectData = Tw2PerObjectData.from(EveChild.perObjectData);
            }

            mat4.transpose(this._perObjectData.ffe.Get("world"), this._worldTransform);
            mat4.invert(this._perObjectData.ffe.Get("worldInverseTranspose"), this._worldTransform);
        }

        this.mesh.GetBatches(mode, accumulator, this._perObjectData);
    }

}

Tw2BaseClass.define(EveChildMesh, Type =>
{
    return {
        type: "EveChildMesh",
        props: {
            display: Type.BOOLEAN,
            localTransform: Type.TR_LOCAL,
            lowestLodVisible: Type.NUMBER,
            mesh: ["Tr2InstancedMesh", "Tr2Mesh"],
            minScreenSize: Type.NUMBER,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            sortValueOffset: Type.NUMBER,
            staticTransform: Type.BOOLEAN,
            transformModifiers: [["EveChildModifierBillboard2D", "EveChildModifierBillboard3D", "EveChildModifierCameraOrientedRotationConstrained", "EveChildModifierSRT", "EveChildModifierTranslateWithCamera"]],
            translation: Type.TR_TRANSLATION,
            useSRT: Type.BOOLEAN,
            useSpaceObjectData: Type.BOOLEAN
        },
        notImplemented: [
            "lowestLodVisible",
            "minScreenSize",
            "sortValueOffset",
            "staticTransform"
        ]
    };
});
