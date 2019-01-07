import {Tw2StagingClass} from "../../class";

/**
 * Tw2Mesh
 * @ccp Tr2Mesh
 * @implements Mesh
 *
 * @parameter {Array.<MeshArea>} additiveAreas      -
 * @parameter {Array.<MeshArea>} decalAreas         -
 * @parameter {Boolean} deferGeometryLoad           -
 * @parameter {Array.<MeshArea>} depthAreas         -
 * @parameter {Array.<MeshArea>} depthNormalAreas   -
 * @parameter {Array.<MeshArea>} distortionAreas    -
 * @parameter {String} geometryResPath              -
 * @parameter {Number} meshIndex                    -
 * @parameter {Array.<MeshArea>} opaqueAreas        -
 * @parameter {Array.<MeshArea>} opaquePrepassAreas -
 * @parameter {Array.<MeshArea>} pickableAreas      -
 * @parameter {Array.<MeshArea>} transparentAreas   -
 */
export default class Tw2Mesh extends Tw2StagingClass
{

    additiveAreas = [];
    decalAreas = [];
    deferGeometryLoad = false;
    depthAreas = [];
    depthNormalAreas = [];
    distortionAreas = [];
    geometryResPath = "";
    meshIndex = 0;
    opaqueAreas = [];
    opaquePrepassAreas = [];
    pickableAreas = [];
    transparentAreas = [];

}

Tw2StagingClass.define(Tw2Mesh, Type =>
{
    return {
        type: "Tw2Mesh",
        category: "Mesh",
        props: {
            additiveAreas: [["Tw2MeshArea"]],
            decalAreas: [["Tw2MeshArea"]],
            deferGeometryLoad: Type.BOOLEAN,
            depthAreas: [["Tw2MeshArea"]],
            depthNormalAreas: [["Tw2MeshArea"]],
            distortionAreas: [["Tw2MeshArea"]],
            geometryResPath: Type.PATH,
            meshIndex: Type.NUMBER,
            opaqueAreas: [["Tw2MeshArea"]],
            opaquePrepassAreas: [["Tw2MeshArea"]],
            pickableAreas: [["Tw2MeshArea"]],
            transparentAreas: [["Tw2MeshArea"]]
        }
    };
});

