/* eslint-env node */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");
const glMatrix = require("gl-matrix");


function loadReader(formatGr2)
{
    const filename = path.resolve(__dirname, "../src/core/reader/geometry/Gr2Reader.js");
    const source = fs.readFileSync(filename, "utf8");
    const output = transformSync(source, {
        babelrc: false,
        configFile: false,
        filename,
        plugins: [
            [ require("@babel/plugin-proposal-class-properties"), { loose: true } ],
            require("@babel/plugin-transform-modules-commonjs")
        ]
    });

    class Tw2Error extends Error
    {
        constructor(data = {}, message = "Undefined error")
        {
            super(message);
            this.data = data;
        }
    }

    class Tw2VertexDeclaration
    {
        constructor()
        {
            this.elements = [];
            this.stride = 0;
        }

        RebuildHash() {}
    }

    class Tw2VertexElement
    {
        static from(values)
        {
            return values;
        }
    }

    Tw2VertexElement.Type = {
        POSITION: 0,
        COLOR: 1,
        NORMAL: 2,
        TANGENT: 3,
        BITANGENT: 4,
        BINORMAL: 5,
        TEXCOORD: 5,
        BLENDINDICES: 6,
        BLENDWEIGHT: 7
    };

    class Tw2GeometryMesh
    {
        constructor()
        {
            this.name = "";
            this.minBounds = glMatrix.vec3.create();
            this.maxBounds = glMatrix.vec3.create();
            this.areas = [];
            this.boneBindings = [];
            this.boneBounds = [];
            this.blendShapes = [];
            this.forceSystemMirror = false;
        }

        RecalculateAreaBounds() {}
        RebuildBounds() {}
    }

    class Tw2GeometryMeshArea
    {
        constructor()
        {
            this.minBounds = glMatrix.vec3.create();
            this.maxBounds = glMatrix.vec3.create();
        }
    }

    class Tw2GeometryBone
    {
        constructor()
        {
            this.name = "";
            this.position = glMatrix.vec3.create();
            this.orientation = glMatrix.quat.create();
            this.scaleShear = glMatrix.mat3.create();
            this.localTransform = glMatrix.mat4.create();
            this.worldTransform = glMatrix.mat4.create();
            this.worldTransformInv = glMatrix.mat4.create();
        }

        UpdateTransform() {}
    }

    class Tw2GeometrySkeleton
    {
        constructor()
        {
            this.bones = [];
        }

        BuildTrackMasks() {}
    }

    class Tw2GeometryModel
    {
        constructor()
        {
            this.meshBindings = [];
            this.skeleton = null;
        }

        FindBoneByName(name)
        {
            return this.skeleton.bones.find(bone => bone.name === name) || null;
        }
    }

    class EmptyGeometryType
    {
        constructor()
        {
            this.trackGroups = [];
            this.transformTracks = [];
        }
    }

    const gl = {
        ARRAY_BUFFER: 0x8892,
        ELEMENT_ARRAY_BUFFER: 0x8893,
        STATIC_DRAW: 0x88e4,
        UNSIGNED_INT: 0x1405,
        UNSIGNED_SHORT: 0x1403,
        createBuffer: () => ({}),
        bindBuffer() {},
        bufferData() {}
    };

    const modules = {
        "@carbonenginejs/format-gr2": { __esModule: true, default: formatGr2 },
        "core/vertex": { Tw2VertexDeclaration, Tw2VertexElement },
        "core/Tw2Error": { Tw2Error },
        "core/reader/granny": { Gr2CurveReader: class {} },
        math: {
            vec3: glMatrix.vec3,
            quat: glMatrix.quat,
            mat4: glMatrix.mat4,
            mat3: glMatrix.mat3,
            box3: {
                create: () => ({}),
                fromBounds: (out, minBounds, maxBounds) => Object.assign(out, { minBounds, maxBounds }),
                bounds: { isEmpty: () => false }
            }
        },
        "constant/gl": { GL_FLOAT: 0x1406 },
        "global/tw2": { device: { gl } },
        "geo-ambient-occlusion": { __esModule: true, default: () => { throw new Error("AO must be disabled in this test"); } },
        "core/geometry": {
            Tw2GeometryAnimation: EmptyGeometryType,
            Tw2GeometryBone,
            Tw2GeometryCurve: EmptyGeometryType,
            Tw2GeometryMesh,
            Tw2GeometryMeshArea,
            Tw2GeometryModel,
            Tw2GeometrySkeleton,
            Tw2GeometryTrackGroup: EmptyGeometryType,
            Tw2GeometryTransformTrack: EmptyGeometryType
        }
    };

    const module = { exports: {} };
    const localRequire = id =>
    {
        if (!(id in modules)) throw new Error(`Unexpected Gr2Reader dependency: ${id}`);
        return modules[id];
    };
    new Function("require", "module", "exports", output.code)(localRequire, module, module.exports);
    return module.exports;
}


function loadGsfReader(formatGr2)
{
    const filename = path.resolve(__dirname, "../src/core/reader/geometry/GsfReader.js");
    const source = fs.readFileSync(filename, "utf8");
    const output = transformSync(source, {
        babelrc: false,
        configFile: false,
        filename,
        plugins: [
            [ require("@babel/plugin-proposal-class-properties"), { loose: true } ],
            require("@babel/plugin-transform-modules-commonjs")
        ]
    });

    const modules = {
        "@carbonenginejs/format-gr2": { __esModule: true, default: formatGr2 }
    };

    const module = { exports: {} };
    const localRequire = id =>
    {
        if (!(id in modules)) throw new Error(`Unexpected GsfReader dependency: ${id}`);
        return modules[id];
    };
    new Function("require", "module", "exports", output.code)(localRequire, module, module.exports);
    return module.exports;
}


function testMorphsAndBindings(Gr2Reader)
{
    const authoredScale = [
        0.75, 0, 0,
        0, 0.75, 0,
        0, 0, 0.75
    ];
    const data = {
        meshes: [ {
            name: "Face",
            minBounds: [ -1, -1, -1 ],
            maxBounds: [ 1, 1, 1 ],
            vertex: {
                position: [ 0, 0, 0, 1, 0, 0, 0, 1, 0 ],
                normal: [ 0, 0, 1, 0, 0, 1, 0, 0, 1 ],
                blendIndice: [ 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3 ],
                blendWeight: [ 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0 ]
            },
            indices: [],
            boneBindings: [ { name: "Root" } ],
            morphTargets: [ {
                name: "SmileShape",
                dataIsDeltas: true,
                vertexIndices: [ 0, 2 ],
                vertex: {
                    position: [ 0.1, 0, 0, 0.2, 0, 0 ],
                    normal: [ 0, 0.1, 0, 0, 0.2, 0 ],
                    tangent: [ 0.1, 0, 0, 0, 0.2, 0 ]
                }
            }, {
                name: "Blinkshape",
                dataIsDeltas: false,
                vertex: { position: [ 0, 0, 0, 1, 0, 0, 0, 0.9, 0 ] }
            } ]
        } ],
        models: [ {
            name: "Character",
            meshBindings: [ 0 ],
            skeleton: {
                name: "CharacterSkeleton",
                bones: [ {
                    name: "Root",
                    parentIndex: 255,
                    position: [ 0, 0, 0 ],
                    orientation: [ 0, 0, 0, 1 ],
                    scaleShear: authoredScale
                } ]
            }
        } ],
        animations: []
    };
    const bindCalls = [];
    const res = {
        meshes: [],
        models: [],
        animations: [],
        constructor: {
            BindMeshToModel(mesh, model, resource, options)
            {
                bindCalls.push({ mesh, model, resource, options });
            }
        }
    };

    Gr2Reader.BuildGeometryRes(data, res, {
        aoGenerate: false,
        firstMeshOnly: false,
        skipInvalidBoneBindings: false
    });

    const mesh = res.meshes[0];
    assert.equal(Gr2Reader.DEFAULT_OPTIONS.swapBlendWeightsAndIndices, false);
    assert.equal(mesh.declaration.swapBlendWeightsAndIndices, false);
    assert.deepEqual(
        mesh.declaration.elements.filter(element => element.usage === 6 || element.usage === 7).map(element => element.usage),
        [ 7, 6 ],
        "default GR2 decode preserves the established legacy blend layout"
    );
    assert.equal(mesh.morphTargets.length, 2);
    assert.equal(mesh.morphTargets[0].name, "Smile");
    assert.equal(mesh.morphTargets[0].sourceName, "SmileShape");
    assert.equal(mesh.morphTargets[1].name, "Blinkshape", "Only an exact trailing Shape suffix is removed");
    assert.equal(mesh.morphTargets[0].dataIsDeltas, true);
    assert.equal(mesh.morphTargets[1].dataIsDeltas, false);
    assert(mesh.morphTargets[0].vertexIndices instanceof Uint32Array);
    assert.deepEqual(Array.from(mesh.morphTargets[0].vertexIndices), [ 0, 2 ]);
    assert(mesh.morphTargets[0].vertex.normal instanceof Float32Array);
    assert(mesh.morphTargets[0].vertex.tangent instanceof Float32Array);
    assert.deepEqual(
        Array.from(mesh.morphTargets[0].vertex.normal),
        Array.from(new Float32Array([ 0, 0.1, 0, 0, 0.2, 0 ]))
    );
    assert.deepEqual(
        Array.from(mesh.morphTargets[0].vertex.tangent),
        Array.from(new Float32Array([ 0.1, 0, 0, 0, 0.2, 0 ]))
    );
    assert.equal(mesh.forceSystemMirror, true);
    assert.deepEqual(mesh.blendShapes, [], "GR2 morphs must not be represented as obsolete blendShapes");
    assert.deepEqual(mesh.boneBindings, [ "Root" ]);
    assert.equal(bindCalls.length, 1);
    assert.equal(bindCalls[0].mesh, mesh);
    assert.equal(bindCalls[0].model, res.models[0]);
    assert.deepEqual(Array.from(res.models[0].skeleton.bones[0].scaleShear), authoredScale);

    const directRes = {
        meshes: [],
        models: [],
        animations: [],
        constructor: { BindMeshToModel() {} }
    };
    Gr2Reader.BuildGeometryRes(data, directRes, {
        aoGenerate: false,
        firstMeshOnly: false,
        skipInvalidBoneBindings: false,
        swapBlendWeightsAndIndices: true
    });
    assert.equal(directRes.meshes[0].declaration.swapBlendWeightsAndIndices, true);
    assert.deepEqual(
        directRes.meshes[0].declaration.elements.filter(element => element.usage === 6 || element.usage === 7).map(element => element.usage),
        [ 6, 7 ],
        "explicit direct decode maps indices to 6 and weights to 7"
    );
}


function testGsfBoundary(exports, formatGr2, gsfBytes)
{
    const { ErrGr2GeometryExpected, Gr2Reader } = exports;
    assert.equal(Gr2Reader.IsGSF(gsfBytes), true);
    assert.throws(
        () => Gr2Reader.Prepare(gsfBytes, {}),
        error => error instanceof ErrGr2GeometryExpected && /not render geometry/.test(error.message)
    );
    assert.equal(formatGr2.readCalls, 0, "GSF must not enter the render-geometry JSON build path");
}


function testGsfReaderProjection(exports, formatGr2, gsfBytes, projectedGsf)
{
    const { GsfReader } = exports;
    const res = {};

    assert.equal(GsfReader.IsGSF(gsfBytes), true);
    assert.strictEqual(GsfReader.Read(projectedGsf), projectedGsf);
    assert.equal(GsfReader.IsRaw({ StateMachine: {}, AnimationSets: [] }), false);
    assert.equal(GsfReader.IsRaw({ version: 7, fileInfo: { Meshes: [] } }), false);
    GsfReader.Prepare(gsfBytes, res);

    assert.equal(res.gsf, projectedGsf);
    assert.equal(res.stateMachine, projectedGsf.stateMachine);
    assert.equal(res.animationSets, projectedGsf.animationSets);
    assert.equal(res.animationSlots, projectedGsf.animationSlots);
    assert.deepEqual(res.gsfReferences, [ "res:/animation/character/female_idle.gr2" ]);
    assert.equal(res.format, "gsf");
    assert.equal(formatGr2.readCalls, 0, "GSF reader must not emit render geometry JSON");
}


async function main()
{
    const gsfBytes = new Uint8Array([ 0x47, 0x53, 0x46 ]);
    const animationSet = {
        AnimationSpecs: [ {
            AnimationFilePath: "res:/animation/character/female_idle.gr2"
        } ]
    };
    const rawGsf = {
        version: 7,
        secCount: 2,
        fileInfo: {
            StateMachine: { Name: "Female" },
            AnimationSlots: [ { Name: "Idle" } ],
            AnimationSets: [ animationSet ],
            ModelNameHint: "Female",
            ModelIndexHint: 0,
            RetargetSourceModelNameHint: null,
            RetargetSourceModelIndexHint: -1,
            NumUniqueTokenized: 4,
            EditorData: null,
            ExtendedData: null
        }
    };
    const projectedGsf = {
        format: "gsf",
        container: {
            family: "granny",
            revision: 7,
            sectionCount: 2
        },
        character: {
            modelNameHint: "Female",
            modelIndexHint: 0,
            retargetSourceModelNameHint: null,
            retargetSourceModelIndexHint: -1
        },
        stateMachine: rawGsf.fileInfo.StateMachine,
        animationSlots: rawGsf.fileInfo.AnimationSlots,
        animationSets: [ {
            index: 0,
            sourceFileReferences: [ "res:/animation/character/female_idle.gr2" ],
            raw: animationSet
        } ],
        uniqueTokenCount: 4,
        editorData: null,
        extendedData: null
    };
    const formatGr2 = {
        readCalls: 0,
        readRaw(data)
        {
            assert.equal(data, gsfBytes, "Reader must pass original GSF bytes to format-gr2");
            return rawGsf;
        },
        readGsf(data)
        {
            assert.equal(data, rawGsf, "GSF reader must project from the reflected Granny State root");
            return projectedGsf;
        },
        read()
        {
            this.readCalls++;
            throw new Error("GSF must not be emitted as geometry JSON");
        },
        isGsf(data)
        {
            assert.equal(data, gsfBytes, "IsGSF must pass original bytes to format-gr2");
            return true;
        },
        gsf: { isRaw: raw => raw === rawGsf }
    };
    const exports = loadReader(formatGr2);
    const gsfExports = loadGsfReader(formatGr2);

    testMorphsAndBindings(exports.Gr2Reader);
    testGsfBoundary(exports, formatGr2, gsfBytes);
    testGsfReaderProjection(gsfExports, formatGr2, gsfBytes, projectedGsf);

    const { CjsFormatGr2 } = await import("@carbonenginejs/format-gr2");
    assert.equal(CjsFormatGr2.isGsf(rawGsf), true);
    assert.equal(CjsFormatGr2.readGsf(rawGsf).format, "gsf");
    assert.equal(CjsFormatGr2.isGsf(new Uint8Array(16)), false, "Byte detection must fail closed for non-GSF data");

    console.log("GR2 morph ingestion, GSF boundary, GSF reader projection, root scale, and bone binding verified");
}


main().catch(err =>
{
    console.error(err);
    process.exitCode = 1;
});
