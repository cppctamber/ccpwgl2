import {vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2InstancedMesh
 * @ccp Tr2InstancedMesh
 * @implements Mesh
 *
 * @parameter {Array.<MeshArea>} additiveAreas                                          -
 * @parameter {Array.<MeshArea>} decalAreas                                             -
 * @parameter {Array.<MeshArea>} depthAreas                                             -
 * @parameter {Array.<MeshArea>} distortionAreas                                        -
 * @parameter {String} geometryResPath                                                  -
 * @parameter {String} instanceGeometryResPath                                          -
 * @parameter {ParticleSystem|Tw2RuntimeInstanceData|Resource} instanceGeometryResource -
 * @parameter {Number} instanceMeshIndex                                                -
 * @parameter {vec3} maxBounds                                                          -
 * @parameter {vec3} minBounds                                                          -
 * @parameter {Array.<MeshArea>} opaqueAreas                                            -
 * @parameter {Array.<MeshArea>} transparentAreas                                       -
 */
export default class Tw2InstancedMesh extends Tw2StagingClass
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

Tw2StagingClass.define(Tw2InstancedMesh, Type =>
{
    return {
        type: "Tw2InstancedMesh",
        category: "Mesh",
        props: {
            additiveAreas: [["Tw2MeshArea"]],
            decalAreas: [["Tw2MeshArea"]],
            depthAreas: [["Tw2MeshArea"]],
            distortionAreas: [["Tw2MeshArea"]],
            geometryResPath: Type.PATH,
            instanceGeometryResPath: Type.PATH,
            instanceGeometryResource: ["Tw2ParticleSystem", "Tw2RuntimeInstanceData", "Tw2GeometryRes"],
            instanceMeshIndex: Type.NUMBER,
            maxBounds: Type.VECTOR3,
            minBounds: Type.VECTOR3,
            opaqueAreas: [["Tw2MeshArea"]],
            transparentAreas: [["Tw2MeshArea"]]
        }
    };
});

