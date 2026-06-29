import { meta } from "utils";
import { quat, vec2, vec3, vec4 } from "math";
import { Tr2CurveInterpolation, Tr2CurveTangentType } from "./Tr2CurveMath";


export class Tr2CurveKey extends meta.Model
{
    @meta.float
    time = 0;

    static Compare(a, b)
    {
        return a.time - b.time;
    }
}


@meta.define({
    ccp: "Tr2CurveScalarKey",
    wgl: "Tw2CurveScalarKey"
})
export class Tr2CurveScalarKey extends Tr2CurveKey
{
    @meta.float
    value = 0;

    @meta.float
    leftTangent = 0;

    @meta.float
    rightTangent = 0;

    @meta.ushort
    id = 0;

    @meta.byte
    interpolation = Tr2CurveInterpolation.HERMITE;

    @meta.byte
    tangentType = Tr2CurveTangentType.AUTO_CLAMP;

    constructor(options)
    {
        super();
        if (options) this.SetValues(options);
    }

    static blackStruct(reader)
    {
        return new Tr2CurveScalarKey({
            time: reader.ReadF32(),
            value: reader.ReadF32(),
            leftTangent: reader.ReadF32(),
            rightTangent: reader.ReadF32(),
            id: reader.ReadU16(),
            interpolation: reader.ReadU8(),
            tangentType: reader.ReadU8()
        });
    }

    SetValues(options, opt)
    {
        super.SetValues(options, opt);
        return this;
    }

    ToDefinition()
    {
        return {
            time: this.time,
            value: this.value,
            leftTangent: this.leftTangent,
            rightTangent: this.rightTangent,
            id: this.id,
            interpolation: this.interpolation,
            tangentType: this.tangentType
        };
    }
}

export { Tr2CurveScalarKey as Tw2CurveScalarKey };


export class Tr2CurveColorKey extends Tr2CurveKey
{
    @meta.color
    value = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    leftTangent = vec4.create();

    @meta.color
    rightTangent = vec4.create();

    @meta.uint
    interpolation = 0;

    @meta.uint
    tangentType = 0;

    static blackStruct(reader)
    {
        const item = new Tr2CurveColorKey();
        item.time = reader.ReadF32();
        item.value = vec4.fromValues(reader.ReadF32(), reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
        item.leftTangent = vec4.fromValues(reader.ReadF32(), reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
        item.rightTangent = vec4.fromValues(reader.ReadF32(), reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
        item.interpolation = reader.ReadU32();
        item.tangentType = reader.ReadU32();
        return item;
    }
}


export class Tr2CurveVector2Key extends Tr2CurveKey
{
    @meta.vector2
    value = vec2.create();

    @meta.vector2
    leftTangent = vec2.create();

    @meta.vector2
    rightTangent = vec2.create();

    @meta.uint
    interpolation = 0;

    @meta.uint
    tangentType = 0;

    static blackStruct(reader)
    {
        const item = new Tr2CurveVector2Key();
        item.time = reader.ReadF32();
        item.value = vec2.fromValues(reader.ReadF32(), reader.ReadF32());
        item.leftTangent = vec2.fromValues(reader.ReadF32(), reader.ReadF32());
        item.rightTangent = vec2.fromValues(reader.ReadF32(), reader.ReadF32());
        item.interpolation = reader.ReadU32();
        item.tangentType = reader.ReadU32();
        return item;
    }
}


export class Tr2CurveVector3Key extends Tr2CurveKey
{
    @meta.vector3
    value = vec3.create();

    @meta.vector3
    leftTangent = vec3.create();

    @meta.vector3
    rightTangent = vec3.create();

    @meta.uint
    interpolation = 0;

    @meta.uint
    tangentType = 0;

    static blackStruct(reader)
    {
        const item = new Tr2CurveVector3Key();
        item.time = reader.ReadF32();
        item.value = vec3.fromValues(reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
        item.leftTangent = vec3.fromValues(reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
        item.rightTangent = vec3.fromValues(reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
        item.interpolation = reader.ReadU32();
        item.tangentType = reader.ReadU32();
        return item;
    }
}


export class Tr2CurveEulerRotationKey extends Tr2CurveKey
{
    @meta.vector3
    value = vec3.create();

    @meta.vector3
    leftTangent = vec3.create();

    @meta.vector3
    rightTangent = vec3.create();

    @meta.uint
    interpolation = 0;

    @meta.uint
    tangentType = 0;

    static blackStruct(reader)
    {
        const item = new Tr2CurveEulerRotationKey();
        item.time = reader.ReadF32();
        item.value = vec3.fromValues(reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
        item.leftTangent = vec3.fromValues(reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
        item.rightTangent = vec3.fromValues(reader.ReadF32(), reader.ReadF32(), reader.ReadF32());
        item.interpolation = reader.ReadU32();
        item.tangentType = reader.ReadU32();
        return item;
    }
}


export class Tr2CurveQuaternionKey extends Tr2CurveKey
{
    @meta.quaternion
    value = quat.create();

    @meta.ushort
    id = 0;

    @meta.ushort
    interpolation = Tr2CurveInterpolation.LINEAR;

    constructor(options)
    {
        super();
        if (options) this.SetValues(options);
    }

    static blackStruct(reader)
    {
        return new Tr2CurveQuaternionKey({
            time: reader.ReadF32(),
            value: quat.fromValues(reader.ReadF32(), reader.ReadF32(), reader.ReadF32(), reader.ReadF32()),
            id: reader.ReadU16(),
            interpolation: reader.ReadU16()
        });
    }

    SetValues(options, opt)
    {
        super.SetValues(options, opt);
        return this;
    }

    ToDefinition()
    {
        return {
            time: this.time,
            value: Array.from(this.value),
            id: this.id,
            interpolation: this.interpolation
        };
    }
}
