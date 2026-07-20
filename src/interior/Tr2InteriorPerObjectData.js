import { mat4 } from "math";
import { Tw2PerObjectData, Tw2RawData } from "core";
import {
    CewgInteriorPerObjectAdapter,
    CewgInteriorPerObjectData
} from "./cewg/CewgInteriorPerObjectData";


const
    REG = 4,
    INTERIOR_LIGHT_REGISTER_COUNT = 6,
    MAX_INTERIOR_LIGHTS_PER_OBJECT = 10,
    INTERIOR_SPOT_LIGHT_DATA_OFFSET = 74 * REG,
    LEGACY_SKINNED_WORLD_MAT_OFFSET = 195 * REG,
    LEGACY_JOINT_MAT_SIZE = 696,
    LEGACY_SKINNED_VS_SIZE = 200 * REG,
    INTERIOR_PS_SIZE = 77 * REG,
    INTERIOR_POINT_LIGHTS_SIZE = MAX_INTERIOR_LIGHTS_PER_OBJECT * INTERIOR_LIGHT_REGISTER_COUNT * REG,
    INTERIOR_SHADOW_DATA_SIZE = 2 * REG,
    INTERIOR_SPOT_LIGHT_PADDING_SIZE = INTERIOR_SPOT_LIGHT_DATA_OFFSET - INTERIOR_POINT_LIGHTS_SIZE - INTERIOR_SHADOW_DATA_SIZE,
    INTERIOR_SPOT_LIGHT_DATA_SIZE = INTERIOR_PS_SIZE - INTERIOR_SPOT_LIGHT_DATA_OFFSET;


/**
 * GLES-compatible interior/avatar per-object data.
 *
 * Carbon's interior VS object data is small (`WorldMat`, UV transform, UV
 * translation). Legacy GLES skinned character shaders additionally inline the
 * per-area bone palette in cb3 because WebGL cannot consume Carbon's DX-style
 * structured bone data. Keep that GLES splice local to the interior path.
 */
export class GLESPerObjectDataInterior extends Tw2PerObjectData
{
    constructor(opt)
    {
        super();
        const data = opt && opt.skinned === false
            ? GLESPerObjectDataInterior.layout
            : GLESPerObjectDataInterior.skinnedLayout;
        if (data.vs) this.vs = this.constructor.RawData(data.vs, opt);
        if (data.ps) this.ps = this.constructor.RawData(data.ps, opt);
        if (data.ffe) this.ffe = this.constructor.RawData(data.ffe, opt);
        this.psInt = new Int32Array(16 * 4);
        this.cewgInteriorData = new CewgInteriorPerObjectData();
        this.cewgPerObjectPacker = GLESPerObjectDataInterior.CEWG_PER_OBJECT_PACKER;
    }

    /**
     * Packs semantic-ish interior data into the GLES cb3/cb4 carrier.
     * @param {Object} bag
     * @param {GLESPerObjectDataInterior} [perObjectData]
     * @returns {GLESPerObjectDataInterior}
     */
    static Pack(bag = {}, perObjectData = new this())
    {
        const { vs, ps } = perObjectData;

        // Interior and space objects can share an accumulator. Carry the
        // interior frame pair with each draw instead of replacing the device's
        // EveSpaceScene frame buffers while batches are only being collected.
        perObjectData.perFrameVSData = bag.perFrameVSData || null;
        perObjectData.perFramePSData = bag.perFramePSData || null;

        perObjectData.cewgInteriorData = CewgInteriorPerObjectData.Pack(
            bag,
            perObjectData.cewgInteriorData
        );

        if (vs)
        {
            // Skinned avatar shaders consume WorldMat as four column vectors at
            // cb3[195..198]. Unskinned interior shaders dot against matrix rows.
            this.PackMatrix(
                vs,
                "WorldMat",
                bag.worldTransform,
                bag.worldTransformTranspose,
                !vs.Has("JointMat")
            );
            this.PackVector4(vs, "UvLinearTransform", bag.uvLinearTransform, [ 1, 1, 0, 0 ]);
            this.PackVector4(vs, "UvTranslation", bag.uvTranslation, [ 0, 0, 0, 0 ]);

            if (vs.Has("JointMat"))
            {
                this.PackJointMatrices(vs.Get("JointMat"), bag.jointMatrices);
            }
        }

        if (ps)
        {
            const lights = bag.pointLights || bag.interiorLights || [];
            const lightCount = Math.min(lights.length, MAX_INTERIOR_LIGHTS_PER_OBJECT);

            ps.Get("InteriorPointLights").fill(0);
            ps.Get("ShadowCaster0").fill(0);
            ps.Get("ShadowCaster1").fill(0);
            ps.Get("InteriorSpotLightPadding").fill(0);
            ps.Get("SpotLightData").fill(0);

            if (perObjectData.psInt)
            {
                perObjectData.psInt.fill(0);
                // i15.x = active interior light count, i15.yzw unused
                perObjectData.psInt[15 * REG] = lightCount;
            }

            for (let i = 0; i < lightCount; i++)
            {
                const light = lights[i] && lights[i].PopulateLightData
                    ? lights[i].PopulateLightData()
                    : lights[i];
                this.PackLight(ps.Get("InteriorPointLights"), i, light);
            }

            if (bag.shadowCaster0) ps.Set("ShadowCaster0", bag.shadowCaster0);
            if (bag.shadowCaster1) ps.Set("ShadowCaster1", bag.shadowCaster1);
            if (bag.spotLightMatrices) ps.Set("SpotLightData", bag.spotLightMatrices);
            if (bag.spotLightData) ps.Set("SpotLightData", bag.spotLightData);

            const spotLightData = ps.Get("SpotLightData");
            if (!bag.spotLightMatrices && !bag.spotLightData && spotLightData.length >= 12)
            {
                spotLightData.set(GLESPerObjectDataInterior.IDENTITY_SPOT_LIGHT_DATA);
            }
        }

        return perObjectData;
    }

    static PackMatrix(rawData, name, matrix, matrixTranspose, transpose = true)
    {
        if (!rawData.Has(name)) return;

        if (matrix)
        {
            if (transpose) mat4.transpose(rawData.Get(name), matrix);
            else rawData.Set(name, matrix);
        }
        else if (matrixTranspose)
        {
            if (transpose) rawData.Set(name, matrixTranspose);
            else mat4.transpose(rawData.Get(name), matrixTranspose);
        }
        else
        {
            rawData.Set(name, GLESPerObjectDataInterior.IDENTITY_MAT4);
        }
    }

    static PackVector4(rawData, name, value, fallback)
    {
        if (!rawData.Has(name)) return;
        rawData.Set(name, value || fallback);
    }

    static PackJointMatrices(out, jointMatrices)
    {
        out.set(GLESPerObjectDataInterior.IDENTITY_JOINT_MAT);
        if (!jointMatrices || !jointMatrices.length) return;

        const count = Math.min(out.length, jointMatrices.length);
        for (let i = 0; i < count; i++)
        {
            out[i] = jointMatrices[i];
        }
    }

    static PackLight(out, index, light)
    {
        light = light || {};

        const
            offset = index * INTERIOR_LIGHT_REGISTER_COUNT * REG,
            position = light.position || light.translation || GLESPerObjectDataInterior.ZERO4,
            color = light.color || GLESPerObjectDataInterior.ZERO4,
            spotDirection = light.spotDirection || light.direction || GLESPerObjectDataInterior.ZERO4,
            boxTransformRow3 = light.boxTransformRow3 || GLESPerObjectDataInterior.ZERO4,
            boxTransformRow4 = light.boxTransformRow4 || GLESPerObjectDataInterior.ZERO4;

        out[offset + 0] = position[0] || 0;
        out[offset + 1] = position[1] || 0;
        out[offset + 2] = position[2] || 0;
        out[offset + 3] = light.radius || 0;

        out[offset + 4] = color[0] || 0;
        out[offset + 5] = color[1] || 0;
        out[offset + 6] = color[2] || 0;
        out[offset + 7] = light.pointLightFalloff || light.falloff || 0;

        out[offset + 8] = light.shadow0Influence || 0;
        out[offset + 9] = light.shadow1Influence || 0;
        out[offset + 10] = light.coneCosAlphaOuter || 0;
        out[offset + 11] = light.coneCosAlphaInner || 0;

        out[offset + 12] = spotDirection[0] || 0;
        out[offset + 13] = spotDirection[1] || 0;
        out[offset + 14] = spotDirection[2] || 0;
        out[offset + 15] = 0;

        out.set(boxTransformRow3, offset + 16);
        out.set(boxTransformRow4, offset + 20);
    }

    static RawData(layout, opt)
    {
        return Tw2RawData.from(layout, opt);
    }

    static IDENTITY_MAT4 = Object.freeze([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]);
    static ZERO4 = Object.freeze([ 0, 0, 0, 0 ]);
    static IDENTITY_SPOT_LIGHT_DATA = Object.freeze([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0 ]);
    static IDENTITY_JOINT_MAT = (() =>
    {
        const
            out = new Float32Array(LEGACY_JOINT_MAT_SIZE),
            id = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0 ];

        for (let i = 0; i < out.length; i += id.length)
        {
            out.set(id, i);
        }

        return out;
    })();

    static CEWG_PER_OBJECT_PACKER = new CewgInteriorPerObjectAdapter();

    static layout = Object.freeze({
        vs: [
            [ "WorldMat", 16 ],
            [ "UvLinearTransform", [ 1, 1, 0, 0 ] ],
            [ "UvTranslation", [ 0, 0, 0, 0 ] ]
        ],
        ps: [
            [ "InteriorPointLights", INTERIOR_POINT_LIGHTS_SIZE ],
            [ "ShadowCaster0", 4 ],
            [ "ShadowCaster1", 4 ],
            [ "InteriorSpotLightPadding", INTERIOR_SPOT_LIGHT_PADDING_SIZE ],
            [ "SpotLightData", INTERIOR_SPOT_LIGHT_DATA_SIZE ]
        ]
    });

    static skinnedLayout = Object.freeze({
        vs: [
            [ "JointMat", LEGACY_JOINT_MAT_SIZE ],
            [ "GlesJointMatPadding", LEGACY_SKINNED_WORLD_MAT_OFFSET - LEGACY_JOINT_MAT_SIZE ],
            [ "WorldMat", 16 ],
            [ "UvLinearTransform", [ 1, 1, 0, 0 ] ]
        ],
        ps: GLESPerObjectDataInterior.layout.ps
    });
}

export { GLESPerObjectDataInterior as Tr2InteriorPerObjectData };
