import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * Tr2InstancedMesh
 * @implements Mesh
 *
 * @parameter {Array.<MeshArea>} additiveAreas                                          -
 * @parameter {Array.<MeshArea>} decalAreas                                             -
 * @parameter {Array.<MeshArea>} depthAreas                                             -
 * @parameter {Array.<MeshArea>} distortionAreas                                        -
 * @parameter {String} geometryResPath                                                  -
 * @parameter {String} instanceGeometryResPath                                          -
 * @parameter {ParticleSystem|Tr2RuntimeInstanceData|Resource} instanceGeometryResource -
 * @parameter {Number} instanceMeshIndex                                                -
 * @parameter {vec3} maxBounds                                                          -
 * @parameter {vec3} minBounds                                                          -
 * @parameter {Array.<MeshArea>} opaqueAreas                                            -
 * @parameter {Array.<MeshArea>} transparentAreas                                       -
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

