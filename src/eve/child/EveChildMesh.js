import { meta, vec3, quat, mat4 } from "global";
import { Tw2PerObjectData, Tw2RawData } from "core";
import { EveChild } from "./EveChild";


/**
 * Mesh attachment to space object

 * @property {String} name                              -
 * @property {Boolean} display                          -
 * @property {mat4} localTransform                      -
 * @property {Number} lowestLodVisible                  -
 * @property {Tw2Mesh|Tw2InstancedMesh} mesh            -
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

    @meta.black.string
    name = "";

    @meta.black.boolean
    display = true;

    @meta.black.matrix4
    localTransform = mat4.create();

    @meta.notImplemented
    @meta.black.uint
    lowestLodVisible = 2;

    @meta.black.object
    mesh = null;

    @meta.notImplemented
    @meta.black.float
    minScreenSize = 0;

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.notImplemented
    @meta.black.float
    sortValueOffset = 0;

    @meta.notImplemented
    @meta.black.boolean
    staticTransform = false;

    @meta.notImplemented
    @meta.black.list
    transformModifiers = [];

    @meta.black.vector3
    translation = vec3.create();

    @meta.black.boolean
    useSRT = true;

    @meta.black.boolean
    useSpaceObjectData = true;


    _worldTransform = mat4.create();
    _worldTransformLast = mat4.create();
    _perObjectData = null;


    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.mesh) this.mesh.GetResources(out);
        return out;
    }


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
