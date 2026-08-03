import { mat4 } from "math";
import { Tw2PerObjectData } from "./Tw2PerObjectData";
import { Tw2RawData } from "./Tw2RawData";

const IDENTITY_MAT4 = Object.freeze([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]);


/**
 * GLES-styled base class for ccpwgl compatibility.
 */
export class GLESPerObjectData extends Tw2PerObjectData
{
    static layout = null;

    constructor(layout = null, opt)
    {
        super();

        const data = layout || this.constructor.layout;
        if (!data) return;

        if (data.vs) this.vs = Tw2RawData.from(data.vs, opt);
        if (data.ps) this.ps = Tw2RawData.from(data.ps, opt);
        if (data.ffe) this.ffe = Tw2RawData.from(data.ffe, opt);
    }

    static from(layout, opt)
    {
        return new this(layout, opt);
    }

    ApplyToDevice(device)
    {
        if (device) device.perObjectData = this;
        return this;
    }
}


/**
 * Legacy-compatible alias retained while migrating to GLES naming.
 */
export class Tr2PerObjectData extends GLESPerObjectData
{
}

/**
 * Base GLES-style per-object data for standard space objects (legacy + new path).
 */
export class GLESPerObjectDataEveSpaceObject extends GLESPerObjectData
{
    static layout = Object.freeze({
        vs: [
            [ "WorldMat", 16 ],
            [ "WorldMatLast", 16 ],
            [ "InvWorldMat", 16 ],
            // Shipdata is four independent floats, not a bitfield.
            // confirmed as (source-backed, CarbonEngine EveSpaceObject2):
            [ "Shipdata", [
                0,     // .x confirmed as: booster glow intensity (EveShip2.cpp:285)
                1,     // .y confirmed as: activation strength (EveSpaceObject2.cpp:739; EveMobile.cpp:210 scales it)
                0,     // .z confirmed as: dirt level (EveSpaceObject2.cpp:744)
                1      // .w confirmed as: bounding sphere radius - the shader needs the object's
                //    size for surface scaling (EveSpaceObject2.cpp:742, re-stamped :1471)
            ] ],
            // confirmed as: clipSphereCenter.xyz + clipRadiusSq.w, a SIGNED squared radius -
            // the sign carries the inside/outside test (EveSpaceObject2.cpp:751-753;
            // shadercompiler/tests/RayTracingTest.cpp:678-679 does sign(w) * dot(d,d) - w)
            [ "Clipdata1", 4 ],
            [ "EllipsoidRadii", 4 ],
            [ "EllipsoidCenter", 4 ],
            [ "CustomMaskMatrix0", [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ] ],
            [ "CustomMaskMatrix1", [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ] ],
            // .x confirmed as: the enable flag, written as exactly 1.0 whenever a mask is
            // present and 0 when absent - NOT unused (EveCustomMask.cpp:74 fill / :88-93 zero).
            // .y is the mirror flag, as assumed here. Carbon zeroes the whole vec4 for an
            // absent slot; ccpwgl instead gates through CustomMaskTarget, which appears
            // equivalent in effect but is a different mechanism.
            [ "CustomMaskData0", [ 1, 0, 0, 0 ] ], // enable, mirror
            [ "CustomMaskData1", [ 1, 0, 0, 0 ] ], // enable, mirror

            // gles doesn't use these
            //[ "BoneOffsets", [
            //    0, // current frame bone buffer offset
            //    0, // previous frame bone buffer offse
            //    0, // bone count
            //    0, // unused
            // ]],                   // gles doesn't use these
            //[ "MorphTargetData", [ // EveChildMesh only
            //   0, // activeMorphTargetsCount
            //   0, // morphTargetAnimationDataOffset
            //   0, // morphTargetVertexDataOffset
            //   0xFFFFFFFF, // bakedMorphTargetVertexDataOffset
            // ]],               
            //[ "CustomData", [0,0,0,0] ],
            
            [ "JointMat", 696 ]
        ],
        ps: [
            // Same four floats as the vs block above; see there for the confirmations.
            [ "Shipdata", [
                0,                          // .x booster glow intensity (EveShip2.cpp:285)
                1,                          // .y activation strength (EveSpaceObject2.cpp:739)
                0,                          // .z dirt level (EveSpaceObject2.cpp:744)
                1                           // .w bounding sphere radius (EveSpaceObject2.cpp:742)
            ] ],
            [ "Clipdata1", 4 ],             // clipSphereCenter.xyz + signed clipRadiusSq.w
            // confirmed as: Carbon's Miscdata - all four lanes are used, none spare
            // (EveSpaceObject2.h:127-131, filled cpp:754-761)
            [ "Miscdata", 4 ],              // .x clipRadius2Sq (signed sq), .y impactDataOffset,
            // .z clipSphereFactor2, .w clipSphereFactor
            [ "ShLighting", 4 * 7 ],        // confirmed as: Tr2ShLightingManager::PACKED_COEFFICIENT_COUNT = 7
            // .yzw are a ccpwgl extension for the old OpenGL shaders, using lanes Carbon
            // leaves at 0 (Carbon: materialIDs = (materialIndex, 0, 0, 0), EveCustomMask.cpp:77).
            // They carry clamp-to-BORDER flags, derived from address mode 4, and drive the
            // GLES clampToBorder helper. Carbon's own clamp-to-EDGE flags are a different
            // quantity from the same enum at value 3, and now ride CustomMaskClamps below.
            [ "CustomMaskMaterialID0", 4 ], // Material Index, Clamp U, Clamp V, Clamp W
            [ "CustomMaskMaterialID1", 4 ], // Material Index, Clamp U, Clamp V, Clamp W
            [ "CustomMaskTarget0", 4 ],     // Material Layer Masking
            [ "CustomMaskTarget1", 4 ],     // Material Layer Masking
            // Carbon's customMaskClamps: one vec4 for BOTH masks, two lanes
            // each - [m0.U, m0.V, m1.U, m1.V] (EveCustomMask.cpp:80-81).
            //
            // This slot previously held ccpwgl's own CustomMaskBlending, which
            // existed only because this path had no permutations; blend mode is
            // a compile-time permutation option in Carbon and ccpwgl now passes
            // it that way.
            //
            // Reusing the slot is deliberate: PackPerObjectPS shifts GLES 0-15
            // to Carbon 12-27, so reg 14 lands exactly on Carbon reg 26 and the
            // packer needs no special case. The GLES shaders do not read it.
            [ "CustomMaskClamps", 4 ],
            [ "Screensize", 4 ]             // custom
        ]
    });

    constructor(opt)
    {
        super(GLESPerObjectDataEveSpaceObject.layout, opt);
    }

    /**
     * Packs a semantic-ish bag of source values into the legacy GLES layout.
     * This is intentionally transitional: objects should not know the final cb layout.
     * @param {Object} bag
     * @param {Tw2PerObjectData} [perObjectData]
     * @returns {Tw2PerObjectData}
     */
    static Pack(bag = {}, perObjectData = new this())
    {
        const { vs, ps } = perObjectData;

        if (vs)
        {
            this.PackMatrix(vs, "WorldMat", bag.worldTransform, bag.worldTransformTranspose);
            this.PackMatrix(vs, "WorldMatLast", bag.worldTransformLast, bag.worldTransformLastTranspose);

            if (bag.inverseWorldTransform)
            {
                mat4.transpose(vs.Get("InvWorldMat"), bag.inverseWorldTransform);
            }
            else if (bag.inverseWorldTransformTranspose)
            {
                vs.Set("InvWorldMat", bag.inverseWorldTransformTranspose);
            }
            else if (bag.worldTransform)
            {
                const invWorldMat = vs.Get("InvWorldMat");
                if (!mat4.invert(invWorldMat, bag.worldTransform)) mat4.identity(invWorldMat);
                mat4.transpose(invWorldMat, invWorldMat);
            }

            this.PackShipData(vs, bag);
            this.PackClipData(vs, bag);

            this.PackVector4(vs, "EllipsoidRadii", bag.ellipsoidRadii);
            this.PackVector4(vs, "EllipsoidCenter", bag.ellipsoidCenter);
            if (bag.customMaskMatrix0) vs.Set("CustomMaskMatrix0", bag.customMaskMatrix0);
            if (bag.customMaskMatrix1) vs.Set("CustomMaskMatrix1", bag.customMaskMatrix1);
            if (bag.customMaskData0) vs.Set("CustomMaskData0", bag.customMaskData0);
            if (bag.customMaskData1) vs.Set("CustomMaskData1", bag.customMaskData1);
            if (bag.jointMatrices) vs.Set("JointMat", bag.jointMatrices);
        }

        if (ps)
        {
            this.PackShipData(ps, bag);
            this.PackClipData(ps, bag);

            if (bag.miscData) ps.Set("Miscdata", bag.miscData);
            if (bag.sphericalHarmonicLighting) ps.Set("ShLighting", bag.sphericalHarmonicLighting);
            if (bag.customMaskMaterialID0) ps.Set("CustomMaskMaterialID0", bag.customMaskMaterialID0);
            if (bag.customMaskMaterialID1) ps.Set("CustomMaskMaterialID1", bag.customMaskMaterialID1);
            if (bag.customMaskTarget0) ps.Set("CustomMaskTarget0", bag.customMaskTarget0);
            if (bag.customMaskTarget1) ps.Set("CustomMaskTarget1", bag.customMaskTarget1);
            if (bag.customMaskClamps) ps.Set("CustomMaskClamps", bag.customMaskClamps);
            if (bag.screenSize) ps.Set("Screensize", bag.screenSize);
        }

        return perObjectData;
    }

    /**
     * Unpacks the legacy GLES layout into a semantic-ish bag for debugging,
     * adapters, and temporary render pipeline plumbing.
     * Values are references to the raw data; treat them as read-only.
     * @param {Tw2PerObjectData} perObjectData
     * @param {Object} [out]
     * @returns {Object}
     */
    static Unpack(perObjectData, out = {})
    {
        if (!perObjectData) return out;

        const { vs, ps } = perObjectData;

        if (vs)
        {
            if (vs.Has("WorldMat")) out.worldTransformTranspose = vs.Get("WorldMat");
            if (vs.Has("WorldMatLast")) out.worldTransformLastTranspose = vs.Get("WorldMatLast");
            if (vs.Has("InvWorldMat")) out.inverseWorldTransformTranspose = vs.Get("InvWorldMat");
            if (vs.Has("EllipsoidRadii")) out.ellipsoidRadii = vs.Get("EllipsoidRadii");
            if (vs.Has("EllipsoidCenter")) out.ellipsoidCenter = vs.Get("EllipsoidCenter");
            if (vs.Has("CustomMaskMatrix0")) out.customMaskMatrix0 = vs.Get("CustomMaskMatrix0");
            if (vs.Has("CustomMaskMatrix1")) out.customMaskMatrix1 = vs.Get("CustomMaskMatrix1");
            if (vs.Has("CustomMaskData0")) out.customMaskData0 = vs.Get("CustomMaskData0");
            if (vs.Has("CustomMaskData1")) out.customMaskData1 = vs.Get("CustomMaskData1");
            if (vs.Has("JointMat")) out.jointMatrices = vs.Get("JointMat");
            this.UnpackShipData(vs, out);
            this.UnpackClipData(vs, out);
        }

        if (ps)
        {
            if (ps.Has("Miscdata")) out.miscData = ps.Get("Miscdata");
            if (ps.Has("ShLighting")) out.sphericalHarmonicLighting = ps.Get("ShLighting");
            if (ps.Has("CustomMaskMaterialID0")) out.customMaskMaterialID0 = ps.Get("CustomMaskMaterialID0");
            if (ps.Has("CustomMaskMaterialID1")) out.customMaskMaterialID1 = ps.Get("CustomMaskMaterialID1");
            if (ps.Has("CustomMaskTarget0")) out.customMaskTarget0 = ps.Get("CustomMaskTarget0");
            if (ps.Has("CustomMaskTarget1")) out.customMaskTarget1 = ps.Get("CustomMaskTarget1");
            if (ps.Has("Screensize")) out.screenSize = ps.Get("Screensize");
            this.UnpackShipData(ps, out);
            this.UnpackClipData(ps, out);
        }

        return out;
    }

    static PackMatrix(rawData, name, matrix, matrixTranspose)
    {
        if (!rawData.Has(name)) return;
        if (matrix)
        {
            mat4.transpose(rawData.Get(name), matrix);
        }
        else if (matrixTranspose)
        {
            rawData.Set(name, matrixTranspose);
        }
        else
        {
            rawData.Set(name, IDENTITY_MAT4);
        }
    }

    static PackVector4(rawData, name, value, w = 0)
    {
        if (!value || !rawData.Has(name)) return;

        const out = rawData.Get(name);
        out[0] = value[0] ?? 0;
        out[1] = value[1] ?? 0;
        out[2] = value[2] ?? 0;
        out[3] = value[3] ?? w;
    }

    static PackShipData(rawData, bag)
    {
        if (!rawData.Has("Shipdata")) return;

        const
            shipData = bag.shipData || rawData.Get("Shipdata"),
            radiusSq = bag.shipData ? undefined : bag.boundingSphereRadiusSq ?? (
                bag.boundingSphereRadius !== undefined
                    ? bag.boundingSphereRadius * bag.boundingSphereRadius
                    : undefined
            );

        rawData.Set("Shipdata", [
            bag.boosterGain ?? shipData[0] ?? 0,
            bag.activationStrength ?? shipData[1] ?? 1,
            bag.dirtLevel ?? shipData[2] ?? 0,
            radiusSq ?? bag.effectScale ?? shipData[3] ?? 1
        ]);
    }

    static PackClipData(rawData, bag)
    {
        if (!rawData.Has("Clipdata1")) return;

        const
            clipData = bag.clipData || bag.clipData1 || rawData.Get("Clipdata1"),
            center = bag.clipSphereCenter || bag.boundingSphereCenter || clipData,
            radiusSq = bag.clipSphereSignedRadiusSq ?? (
                bag.boundingSphereRadius !== undefined
                    ? -(bag.boundingSphereRadius * bag.boundingSphereRadius)
                    : undefined
            );

        rawData.Set("Clipdata1", [
            center[0] ?? 0,
            center[1] ?? 0,
            center[2] ?? 0,
            radiusSq ?? clipData[3] ?? 0
        ]);
    }

    static UnpackShipData(rawData, out)
    {
        if (!rawData.Has("Shipdata")) return;

        const shipData = rawData.Get("Shipdata");
        out.shipData = shipData;
        out.boosterGain = shipData[0];
        out.activationStrength = shipData[1];
        out.dirtLevel = shipData[2];
        out.boundingSphereRadiusSq = shipData[3];
    }

    static UnpackClipData(rawData, out)
    {
        if (!rawData.Has("Clipdata1")) return;

        const clipData = rawData.Get("Clipdata1");
        out.clipData = clipData;
        out.clipSphereCenter = clipData;
        out.clipSphereSignedRadiusSq = clipData[3];
    }
}

export class Tr2PerObjectDataEveSpaceObject extends GLESPerObjectDataEveSpaceObject
{
}


export class GLESPerObjectDataEveMissileWarhead extends GLESPerObjectData
{
    static layout = Object.freeze({
        vs: [
            [ "WorldMat", 16 ],
            [ "WorldMatLast", 16 ],
            [ "Shipdata", [ 0, 1, 0, -10 ] ],
            [ "Clipdata1", 4 ],
        ],
        ps: [
            [ "Shipdata", [ 0, 1, 0, 1 ] ],
            [ "Clipdata1", 4 ],
            [ "Clipdata2", 4 ],
        ]
    });

    constructor(opt)
    {
        super(GLESPerObjectDataEveMissileWarhead.layout, opt);
    }
}


/**
 * Legacy-compatible alias retained while migrating to GLES naming.
 */
export class Tr2PerObjectDataEveMissileWarhead extends GLESPerObjectDataEveMissileWarhead
{
}
