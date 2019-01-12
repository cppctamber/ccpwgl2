import {Tw2BaseClass} from "../../../global";

/**
 * Tr2Mesh
 * @implements Mesh
 *
 * @property {Array.<MeshArea>} additiveAreas      -
 * @property {Array.<MeshArea>} decalAreas         -
 * @property {Boolean} deferGeometryLoad           -
 * @property {Array.<MeshArea>} depthAreas         -
 * @property {Array.<MeshArea>} depthNormalAreas   -
 * @property {Array.<MeshArea>} distortionAreas    -
 * @property {String} geometryResPath              -
 * @property {Number} meshIndex                    -
 * @property {Array.<MeshArea>} opaqueAreas        -
 * @property {Array.<MeshArea>} opaquePrepassAreas -
 * @property {Array.<MeshArea>} pickableAreas      -
 * @property {Array.<MeshArea>} transparentAreas   -
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

