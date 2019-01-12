import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * Tr2InstancedMesh
 * @implements Mesh
 *
 * @property {Array.<MeshArea>} additiveAreas                                          -
 * @property {Array.<MeshArea>} decalAreas                                             -
 * @property {Array.<MeshArea>} depthAreas                                             -
 * @property {Array.<MeshArea>} distortionAreas                                        -
 * @property {String} geometryResPath                                                  -
 * @property {String} instanceGeometryResPath                                          -
 * @property {ParticleSystem|Tr2RuntimeInstanceData|Resource} instanceGeometryResource -
 * @property {Number} instanceMeshIndex                                                -
 * @property {vec3} maxBounds                                                          -
 * @property {vec3} minBounds                                                          -
 * @property {Array.<MeshArea>} opaqueAreas                                            -
 * @property {Array.<MeshArea>} transparentAreas                                       -
 */
export default class Tr2InstancedMesh extends Tw2BaseClass
{

    additiveAreas = [];
    decalAreas = [];
    depthAreas = [];
    distortionAreas = [];
    geometryResPath = "";
    instanceGeometryResPath = "";
    instanceGeometryResource = null;
    instanceMeshIndex = 0;
    maxBounds = vec3.create();
    minBounds = vec3.create();
    opaqueAreas = [];
    transparentAreas = [];

}

Tw2BaseClass.define(Tr2InstancedMesh, Type =>
{
    return {
        isStaging: true,
        type: "Tr2InstancedMesh",
        category: "Mesh",
        props: {
            additiveAreas: [["Tr2MeshArea"]],
            decalAreas: [["Tr2MeshArea"]],
            depthAreas: [["Tr2MeshArea"]],
            distortionAreas: [["Tr2MeshArea"]],
            geometryResPath: Type.PATH,
            instanceGeometryResPath: Type.PATH,
            instanceGeometryResource: ["Tr2ParticleSystem", "Tr2RuntimeInstanceData", "TriGeometryRes"],
            instanceMeshIndex: Type.NUMBER,
            maxBounds: Type.VECTOR3,
            minBounds: Type.VECTOR3,
            opaqueAreas: [["Tr2MeshArea"]],
            transparentAreas: [["Tr2MeshArea"]]
        }
    };
});

