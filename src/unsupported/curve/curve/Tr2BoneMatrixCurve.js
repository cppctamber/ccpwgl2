import { meta } from "utils";
import { mat4 } from "math";
import { Tw2Curve, Tw2CurveKey } from "curve";


@meta.type("Tr2MatrixKey")
@meta.ccp.define("Tr2MatrixKey")
export class Tr2MatrixKey extends Tw2CurveKey
{
    @meta.matrix4
    value = mat4.create();
}


@meta.notImplemented
@meta.type("Tr2BoneMatrixCurve")
@meta.ccp.define("Tr2BoneMatrixCurve")
export class Tr2BoneMatrixCurve extends Tw2Curve
{
    @meta.string
    name = "";

    @meta.float
    length = 1;

    @meta.boolean
    cycle = true;

    @meta.boolean
    reversed = false;

    @meta.matrix4
    startValue = mat4.create();

    @meta.private
    @meta.matrix4
    currentValue = mat4.create();

    @meta.matrix4
    endValue = mat4.create();

    @meta.private
    @meta.notOwned
    @meta.struct()
    skinnedObject = null;

    @meta.list("Tr2MatrixKey")
    keys = [];

    @meta.string
    bone = "";

    @meta.matrix4
    transform = mat4.create();

    cachedJoint = 0xffffffff;

    skeletonTag = 0xffffffff;

    SetBone(bone)
    {
        this.bone = bone;
        this.cachedJoint = 0xffffffff;
        this.skeletonTag = 0xffffffff;
    }

    GetBone()
    {
        return this.bone;
    }

    Sort()
    {
        this.keys.sort(Tw2Curve.Compare);
        if (this.keys.length && this.keys[this.keys.length - 1].time > this.length)
        {
            this.length = this.keys[this.keys.length - 1].time;
        }
    }

    GetLength()
    {
        return this.length;
    }

    UpdateValue(time)
    {
        return this.GetValueAt(time, this.currentValue);
    }

    GetValueAt(time, out = mat4.create())
    {
        if (!this.keys.length)
        {
            mat4.copy(out, this.startValue);
            return out;
        }

        if (time <= this.keys[0].time)
        {
            mat4.copy(out, this.keys[0].value);
            return out;
        }

        const last = this.keys[this.keys.length - 1];
        if (time >= last.time)
        {
            mat4.copy(out, last.value);
            return out;
        }

        for (let i = 0; i < this.keys.length - 1; i++)
        {
            if (time >= this.keys[i].time && time <= this.keys[i + 1].time)
            {
                mat4.copy(out, this.keys[i].value);
                return out;
            }
        }

        mat4.copy(out, this.endValue);
        return out;
    }

    AddKey(time, value)
    {
        const key = new Tr2MatrixKey();
        key.time = time;
        mat4.copy(key.value, value);
        this.keys.push(key);
        this.Sort();
        return key;
    }

    RemoveKey(index)
    {
        if (index >= 0 && index < this.keys.length)
        {
            this.keys.splice(index, 1);
            return true;
        }
        return false;
    }

    GetKeyCount()
    {
        return this.keys.length;
    }

    GetKeyValue(index)
    {
        return this.keys[index] ? this.keys[index].value : null;
    }

    GetKeyTime(index)
    {
        return this.keys[index] ? this.keys[index].time : 0;
    }

    SetKeyValue(index, value)
    {
        if (!this.keys[index])
        {
            return false;
        }

        mat4.copy(this.keys[index].value, value);
        return true;
    }

    SetKeyTime(index, time)
    {
        if (!this.keys[index])
        {
            return false;
        }

        this.keys[index].time = time;
        return true;
    }
}
