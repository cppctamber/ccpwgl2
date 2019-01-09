import {Tw2BaseClass} from "../../class";

/**
 * Tr2Mesh
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
export default class Tr2Mesh extends Tw2BaseClass
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

Tw2BaseClass.define(Tr2Mesh, Type =>
{
    return {
        isStaging: true,
        type: "Tr2Mesh",
        category: "Mesh",
        props: {
            additiveAreas: [["Tr2MeshArea"]],
            decalAreas: [["Tr2MeshArea"]],
            deferGeometryLoad: Type.BOOLEAN,
            depthAreas: [["Tr2MeshArea"]],
            depthNormalAreas: [["Tr2MeshArea"]],
            distortionAreas: [["Tr2MeshArea"]],
            geometryResPath: Type.PATH,
            meshIndex: Type.NUMBER,
            opaqueAreas: [["Tr2MeshArea"]],
            opaquePrepassAreas: [["Tr2MeshArea"]],
            pickableAreas: [["Tr2MeshArea"]],
            transparentAreas: [["Tr2MeshArea"]]
        }
    };
});

