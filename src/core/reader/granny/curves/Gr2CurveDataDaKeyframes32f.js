import { Gr2Curve2 } from "./Gr2Curve2";
import { meta } from "utils";


@meta.type("Gr2CurveDataDaKeyframes32f")
export class Gr2CurveDataDaKeyframes32f extends Gr2Curve2
{

    @meta.uint
    dimension = 0;

    @meta.float32Array
    controls = new Float32Array(0);


    /**
     * Gets the curve type
     * @return {number}
     */
    GetType()
    {
        switch (this.dimension)
        {
            case 3:
                return Gr2Curve2.Type.POSITION;

            case 4:
                return Gr2Curve2.Type.ROTATION;

            case 9:
                return Gr2Curve2.Type.SCALE_SHEAR;

            default:
                throw new ReferenceError(`Invalid dimension (${this.dimension})`);
        }
    }

    /**
     * Gets knot count
     * @return {number}
     */
    GetKnotCount()
    {
        return this.controls.length / this.dimension;
    }

    /**
     * Gets knots
     * @return {Float32Array}
     */
    GetKnots()
    {
        if (!this._knots) this.RebuildKnots();
        return this._knots;
    }

    /**
     * Gets vec3 buffer
     * @return {Float32Array}
     */
    GetVec3Buffer()
    {
        if (this.GetType() === Gr2Curve2.Type.POSITION)
        {
            if (!this._vec3Buffer) this.RebuildVec3Buffer();
            return this._vec3Buffer;
        }
        super.GetVec3Buffer();
    }

    /**
     * Gets quat buffer
     * @return {Float32Array}
     */
    GetQuatBuffer()
    {
        if (this.GetType() === Gr2Curve2.Type.ROTATION)
        {
            if (!this._quatBuffer) this.RebuildQuatBuffer();
            return this._quatBuffer;
        }
        super.GetQuatBuffer();
    }

    /**
     * Gets mat3 buffer
     * @return {Float32Array}
     */
    GetMat3Buffer()
    {
        if (this.GetType() === Gr2Curve2.Type.SCALE_SHEAR)
        {
            if (!this._mat3Buffer) this.RebuildMat3Buffer();
            return this._mat3Buffer;
        }
        super.GetMat3Buffer();
    }

    /**
     * Rebuilds knots
     */
    RebuildKnots()
    {
        const count = this.GetKnotCount();
        this._knots = new Float32Array(count);
        for (let i = 0; i < count; i++) this._knots[i] = i;
    }

    /**
     * Rebuilds vec3 buffer
     */
    RebuildVec3Buffer()
    {
        if (this.GetType() !== Gr2Curve2.Type.POSITION)
        {
            this._vec3Buffer = null;
            return;
        }

        this._vec3Buffer = this.constructor.GetBufferFromControls(this.controls, this.GetKnotCount(), 3);
    }

    /**
     * Rebuilds quat buffer
     */
    RebuildQuatBuffer()
    {
        if (this.GetType() !== Gr2Curve2.Type.ROTATION)
        {
            this._quatBuffer = null;
            return;
        }

        this._quatBuffer = this.constructor.GetBufferFromControls(this.controls, this.GetKnotCount(), 4);
    }

    /**
     * Rebuilds mat3 buffer
     */
    RebuildMat3Buffer()
    {
        if (this.GetType() !== Gr2Curve2.Type.ROTATION)
        {
            this._mat3Buffer = null;
            return;
        }

        this._mat3Buffer = this.constructor.GetBufferFromControls(this.controls, this.GetKnotCount(), 9);
    }

    /**
     * Rebuilds a buffer
     * @param controls
     * @param count
     * @param size
     */
    static GetBufferFromControls(controls, count, size)
    {
        const out = new Float32Array(count * size);
        for (let i = 0; i < count; i++)
        {
            for (let x = 0; x < size; x++)
            {
                out[i * size + x] = controls[i * size + x];
            }
        }
    }

    /**
     * Gr2 curve data format
     * @type {number}
     */
    static format = 0;

}
