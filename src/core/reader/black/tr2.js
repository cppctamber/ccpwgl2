import * as r from "../Tw2BlackClassReaders";

class ConstantParameter
{
    constructor(name, value)
    {
        this.name = name;
        this.value = value;
    }

    static ReadStruct(reader)
    {
        let name = r.string(reader);

        reader.ExpectU16(0, "unknown content");
        reader.ExpectU16(0, "unknown content");
        reader.ExpectU16(0, "unknown content");

        let value = r.vector4(reader);

        return new ConstantParameter(name, value);
    }
}

class Key
{
    static ReadStruct(reader)
    {
        let result = new Key();

        result.time = reader.ReadF32();
        result.value = reader.ReadF32();
        result.startTangent = reader.ReadF32();
        result.endTangent = reader.ReadF32();
        result.index = reader.ReadU16();
        result.interpolation = reader.ReadU8();
        result.extrapolation = reader.ReadU8();

        return result;
    }
}

class ParticleType
{
    constructor(name)
    {
        this.name = name;
    }

    static readStruct(reader)
    {
        let value = reader.ReadU32();
        let name = null;

        if (value === 0)
        {
            name = "LIFETIME";
        }
        else if (value === 1)
        {
            name = "POSITION";
        }
        else if (value === 2)
        {
            name = "VELOCITY";
        }
        else if (value === 3)
        {
            name = "MASS";
        }
        else
        {
            throw `unknown particle type ${value}`;
        }

        return new ParticleType(name);
    }
}

export function tr2(map)
{
    map.set("Tr2ActionAnimateCurveSet", new Map([
        ["curveSet", r.object],
        ["value", r.string],
    ]));

    map.set("Tr2ActionAnimateValue", new Map([
        ["attribute", r.string],
        ["curve", r.object],
        ["path", r.string],
        ["value", r.string],
    ]));

    map.set("Tr2ActionChildEffect", new Map([
        ["childName", r.string],
        ["path", r.string],
        ["removeOnStop", r.boolean],
    ]));

    map.set("Tr2ActionOverlay", new Map([
        ["path", r.string],
    ]));

    map.set("Tr2ActionPlayCurveSet", new Map([
        ["curveSetName", r.string],
        ["rangeName", r.string],
        ["syncToRange", r.boolean],
    ]));

    map.set("Tr2ActionPlayMeshAnimation", new Map([
        ["animation", r.string],
        ["loops", r.uint],
        ["mask", r.string],
    ]));

    map.set("Tr2ActionResetClipSphereCenter", new Map());

    map.set("Tr2ActionSetValue", new Map([
        ["attribute", r.string],
        ["path", r.string],
        ["value", r.string],
    ]));

    map.set("Tr2TranslationAdapter", new Map([
        ["curve", r.object],
        ["value", r.vector3],
    ]));

    map.set("Tr2RotationAdapter", new Map([
        ["curve", r.object],
        ["value", r.vector4],
    ]));

    map.set("Tr2RandomIntegerAttributeGenerator", new Map([
        ["customName", r.string],
        ["minRange", r.vector4],
        ["maxRange", r.vector4],
    ]));

    map.set("Tr2RandomUniformAttributeGenerator", new Map([
        ["customName", r.string],
        ["elementType", r.struct(ParticleType)],
        ["minRange", r.vector4],
        ["maxRange", r.vector4]
    ]));

    map.set("Tr2SphereShapeAttributeGenerator", new Map([
        ["customName", r.string],
        ["distributionExponent", r.float],
        ["maxPhi", r.float],
        ["maxRadius", r.float],
        ["maxSpeed", r.float],
        ["maxTheta", r.float],
        ["minPhi", r.float],
        ["minRadius", r.float],
        ["minSpeed", r.float],
        ["minTheta", r.float],
        ["parentVelocityFactor", r.float],
        ["position", r.vector3],
        ["rotation", r.vector4],
    ]));

    map.set("Tr2PlaneConstraint", new Map([
        ["reflectionNoise", r.float],
        ["generators", r.array],
    ]));

    map.set("Tr2Controller", new Map([
        ["isShared", r.boolean],
        ["stateMachines", r.array],
        ["name", r.string],
        ["variables", r.array],
    ]));

    map.set("Tr2ControllerReference", new Map([
        ["path", r.string],
    ]));

    map.set("Tr2ControllerFloatVariable", new Map([
        ["name", r.string],
        ["defaultValue", r.float],
        ["variableType", r.uint],
    ]));

    map.set("Tr2BoneMatrixCurve", new Map([
        ["name", r.string],
    ]));

    map.set("Tr2CurveColor", new Map([
        ["name", r.string],
        ["r", r.rawObject],
        ["g", r.rawObject],
        ["b", r.rawObject],
        ["a", r.rawObject]
    ]));

    map.set("Tr2CurveConstant", new Map([
        ["name", r.string],
        ["value", r.vector4],
    ]));

    map.set("Tr2CurveEulerRotation", new Map([
        ["name", r.string],
        ["pitch", r.rawObject],
        ["roll", r.rawObject],
        ["yaw", r.rawObject]
    ]));

    map.set("Tr2CurveScalar", new Map([
        ["name", r.string],
        ["timeOffset", r.float],
        ["timeScale", r.float],
        ["extrapolationAfter", r.uint],
        ["extrapolationBefore", r.uint],
        ["keys", r.structList(Key)]
    ]));

    map.set("Tr2CurveVector3", new Map([
        ["name", r.string],
        ["x", r.rawObject],
        ["y", r.rawObject],
        ["z", r.rawObject]
    ]));

    map.set("Tr2CurveEulerRotationExpression", new Map([
        ["inputs", r.array],
        ["name", r.string],
        ["expressionYaw", r.string],
        ["expressionPitch", r.string],
        ["expressionRoll", r.string],
    ]));

    map.set("Tr2CurveScalarExpression", new Map([
        ["inputs", r.array],
        ["name", r.string],
        ["expression", r.string],
        ["input1", r.float],
        ["input2", r.float],
        ["input3", r.float],
    ]));

    map.set("Tr2ScalarExprKey", new Map([
        ["input1", r.float],
        ["input2", r.float],
        ["input3", r.float],
        ["interpolation", r.uint],
        ["left", r.float],
        ["right", r.float],
        ["time", r.float],
        ["timeExpression", r.string],
        ["value", r.float],
    ]));

    map.set("Tr2ScalarExprKeyCurve", new Map([
        ["interpolation", r.uint],
        ["keys", r.array],
        ["name", r.string],
    ]));

    map.set("Tr2CurveVector3Expression", new Map([
        ["inputs", r.array],
        ["name", r.string],
        ["expressionX", r.string],
        ["expressionY", r.string],
        ["expressionZ", r.string],
    ]));

    map.set("Tr2CurveSetRange", new Map([
        ["endTime", r.float],
        ["looped", r.boolean],
        ["name", r.string],
        ["startTime", r.float],
    ]));

    map.set("Tr2DistanceTracker", new Map([
        ["name", r.string],
        ["direction", r.vector3],
        ["targetPosition", r.vector3],
    ]));

    map.set("Tr2Effect", new Map([
        ["effectFilePath", r.path],
        ["name", r.string],
        ["parameters", r.array],
        ["resources", r.array],
        ["constParameters", r.structList(ConstantParameter)],
        ["options", (reader) =>
        {
            throw "lulz";
        }],
        ["samplerOverrides", (reader) =>
        {
            throw "lulz";
        }]
    ]));

    map.set("Tr2DynamicEmitter", new Map([
        ["name", r.string],
        ["particleSystem", r.object],
        ["generators", r.array],
        ["maxParticles", r.uint],
        ["rate", r.float],
    ]));

    map.set("Tr2StaticEmitter", new Map([
        ["name", r.string],
        ["particleSystem", r.object],
        ["geometryResourcePath", r.string],
        ["meshIndex", r.uint],
    ]));

    map.set("Tr2GpuSharedEmitter", new Map([
        ["name", r.string],
        ["particleSystem", r.object],
        ["angle", r.float],
        ["attractorPosition", r.vector3],
        ["attractorStrength", r.float],
        ["color0", r.vector4],
        ["color1", r.vector4],
        ["color2", r.vector4],
        ["color3", r.vector4],
        ["colorMidpoint", r.float],
        ["continuousEmitter", r.boolean],
        ["direction", r.vector3],
        ["drag", r.float],
        ["emissionDensity", r.float],
        ["gravity", r.float],
        ["maxDisplacement", r.float],
        ["maxEmissionDensity", r.float],
        ["maxLifeTime", r.float],
        ["maxSpeed", r.float],
        ["minLifeTime", r.float],
        ["minSpeed", r.float],
        ["position", r.vector3],
        ["inheritVelocity", r.float],
        ["innerAngle", r.float],
        ["radius", r.float],
        ["rate", r.float],
        ["sizeVariance", r.float],
        ["sizes", r.vector3],
        ["scaledByParent", r.boolean],
        ["textureIndex", r.uint],
        ["turbulenceAmplitude", r.float],
        ["turbulenceFrequency", r.float],
        ["velocityStretchRotation", r.float],
    ]));

    map.set("Tr2GpuUniqueEmitter", new Map([
        ["name", r.string],
        ["particleSystem", r.object],
        ["angle", r.float],
        ["attractorPosition", r.vector3],
        ["attractorStrength", r.float],
        ["color0", r.vector4],
        ["color1", r.vector4],
        ["color2", r.vector4],
        ["color3", r.vector4],
        ["colorMidpoint", r.float],
        ["continuousEmitter", r.boolean],
        ["direction", r.vector3],
        ["drag", r.float],
        ["emissionDensity", r.float],
        ["gravity", r.float],
        ["maxDisplacement", r.float],
        ["maxEmissionDensity", r.float],
        ["maxLifeTime", r.float],
        ["maxSpeed", r.float],
        ["minLifeTime", r.float],
        ["minSpeed", r.float],
        ["position", r.vector3],
        ["inheritVelocity", r.float],
        ["innerAngle", r.float],
        ["radius", r.float],
        ["rate", r.float],
        ["sizeVariance", r.float],
        ["sizes", r.vector3],
        ["scaledByParent", r.boolean],
        ["textureIndex", r.uint],
        ["turbulenceAmplitude", r.float],
        ["turbulenceFrequency", r.float],
        ["velocityStretchRotation", r.float],
    ]));

    map.set("Tr2ForceSphereVolume", new Map([
        ["forces", r.array],
        ["radius", r.float],
    ]));

    map.set("Tr2InstancedMesh", new Map([
        ["additiveAreas", r.array],
        ["decalAreas", r.array],
        ["depthAreas", r.array],
        ["distortionAreas", r.array],
        ["geometryResPath", r.string],
        ["instanceGeometryResPath", r.string],
        ["instanceGeometryResource", r.object],
        ["instanceMeshIndex", r.uint],
        ["minBounds", r.vector3],
        ["maxBounds", r.vector3],
        ["opaqueAreas", r.array],
        ["transparentAreas", r.array],
    ]));

    map.set("Tr2InteriorPlaceable", new Map([
        ["placeableResPath", r.string],
        ["transform", r.rawObject]
    ]));

    map.set("Tr2InteriorScene", new Map([
        ["dynamics", r.array],
        ["lights", r.array],
    ]));

    map.set("Tr2InteriorLightSource", new Map([
        ["color", r.vector4],
        ["coneAlphaInner", r.float],
        ["coneAlphaOuter", r.float],
        ["coneDirection", r.vector3],
        ["falloff", r.float],
        ["importanceBias", r.float],
        ["importanceScale", r.float],
        ["kelvinColor", r.object],
        ["name", r.string],
        ["position", r.vector3],
        ["radius", r.float],
        ["useKelvinColor", r.boolean],
    ]));

    map.set("Tr2IntSkinnedObject", new Map([
        ["curveSets", r.array],
        ["transform", r.rawObject],
        ["visualModel", r.object],
    ]));

    map.set("Tr2KelvinColor", new Map([
        ["temperature", r.float],
        ["tint", r.float],
    ]));

    map.set("Tr2Model", new Map([
        ["meshes", r.array],
    ]));

    map.set("Tr2PointLight", new Map([
        ["name", r.string],
        ["brightness", r.float],
        ["color", r.vector4],
        ["noiseAmplitude", r.float],
        ["noiseFrequency", r.float],
        ["noiseOctaves", r.float],
        ["position", r.vector3],
        ["radius", r.float],
    ]));

    map.set("Tr2LodResource", new Map([
        ["name", r.string],
        ["highDetailResPath", r.string],
        ["lowDetailResPath", r.string],
        ["mediumDetailResPath", r.string],
    ]));

    map.set("Tr2Mesh", new Map([
        ["additiveAreas", r.array],
        ["decalAreas", r.array],
        ["deferGeometryLoad", r.boolean],
        ["depthAreas", r.array],
        ["depthNormalAreas", r.array],
        ["distortionAreas", r.array],
        ["geometryResPath", r.string],
        ["meshIndex", r.uint],
        ["name", r.string],
        ["opaqueAreas", r.array],
        ["opaquePrepassAreas", r.array],
        ["pickableAreas", r.array],
        ["transparentAreas", r.array],
    ]));

    map.set("Tr2MeshArea", new Map([
        ["count", r.uint],
        ["effect", r.object],
        ["index", r.uint],
        ["name", r.string],
        ["reversed", r.boolean],
        ["useSHLighting", r.boolean],
    ]));

    map.set("Tr2MeshLod", new Map([
        ["additiveAreas", r.array],
        ["associatedResources", r.array],
        ["decalAreas", r.array],
        ["depthAreas", r.array],
        ["distortionAreas", r.array],
        ["geometryRes", r.object],
        ["opaqueAreas", r.array],
        ["pickableAreas", r.array],
        ["transparentAreas", r.array],
    ]));

    map.set("Tr2ExternalParameter", new Map([
        ["name", r.string],
        ["destinationObject", r.object],
        ["destinationAttribute", r.string],
    ]));

    map.set("Tr2FloatParameter", new Map([
        ["name", r.string],
        ["value", r.float],
    ]));

    map.set("Tr2Matrix4Parameter", new Map([
        ["name", r.string],
        ["value", r.matrix],
    ]));

    map.set("Tr2Texture2dLodParameter", new Map([
        ["name", r.string],
        ["lodResource", r.object],
    ]));

    map.set("Tr2Vector4Parameter", new Map([
        ["name", r.string],
        ["value", r.vector4],
    ]));

    map.set("Tr2ParticleElementDeclaration", new Map([
        ["customName", r.string],
        ["dimension", r.uint],
        ["elementType", r.struct(ParticleType)],
        ["usageIndex", r.uint],
        ["usedByGPU", r.boolean]
    ]));

    map.set("Tr2ParticleAttractorForce", new Map([
        ["magnitude", r.float],
        ["position", r.vector3],
    ]));

    map.set("Tr2ParticleDirectForce", new Map([
        ["force", r.vector3],
    ]));

    map.set("Tr2ParticleDragForce", new Map([
        ["drag", r.float],
    ]));

    map.set("Tr2ParticleFluidDragForce", new Map([
        ["drag", r.float],
    ]));

    map.set("Tr2ParticleTurbulenceForce", new Map([
        ["amplitude", r.vector3],
        ["frequency", r.vector4],
        ["noiseLevel", r.float],
        ["noiseRatio", r.float],
    ]));

    map.set("Tr2ParticleVortexForce", new Map([
        ["axis", r.vector3],
        ["magnitude", r.float],
        ["position", r.vector3],
    ]));

    map.set("Tr2ParticleSpring", new Map([
        ["position", r.vector3],
        ["springConstant", r.float],
    ]));

    map.set("Tr2ParticleSystem", new Map([
        ["constraints", r.array],
        ["name", r.string],
        ["applyAging", r.boolean],
        ["applyForce", r.boolean],
        ["elements", r.array],
        ["emitParticleDuringLifeEmitter", r.object],
        ["emitParticleOnDeathEmitter", r.object],
        ["forces", r.array],
        ["maxParticleCount", r.uint],
        ["requiresSorting", r.boolean],
        ["updateBoundingBox", r.boolean],
        ["updateSimulation", r.boolean],
        ["useSimTimeRebase", r.boolean],
    ]));

    map.set("Tr2GpuParticleSystem", new Map([
        ["clear", r.object],
        ["emit", r.object],
        ["render", r.object],
        ["setDrawParameters", r.object],
        ["setSortParameters", r.object],
        ["sort", r.object],
        ["sortInner", r.object],
        ["sortStep", r.object],
        ["update", r.object],
    ]));

    map.set("Tr2PostProcess", new Map([
        ["stages", r.array],
    ]));

    map.set("Tr2RuntimeInstanceData", new Map());

    map.set("Tr2ShLightingManager", new Map([
        ["primaryIntensity", r.float],
        ["secondaryIntensity", r.float],
    ]));

    map.set("Tr2SkinnedModel", new Map([
        ["geometryResPath", r.string],
        ["meshes", r.array],
        ["name", r.string],
        ["skeletonName", r.string],
    ]));

    map.set("Tr2StateMachine", new Map([
        ["name", r.string],
        ["states", r.array],
        ["startState", r.uint],
    ]));

    map.set("Tr2StateMachineState", new Map([
        ["actions", r.array],
        ["finalizer", r.object],
        ["name", r.string],
        ["transitions", r.array],
    ]));

    map.set("Tr2StateMachineTransition", new Map([
        ["condition", r.string],
        ["name", r.string],
    ]));

    map.set("Tr2SyncToAnimation", new Map());
}
