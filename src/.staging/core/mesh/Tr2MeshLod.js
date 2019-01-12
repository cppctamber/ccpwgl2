import {Tw2BaseClass} from "../../../global";

/**
 * Tr2MeshLod
 *
 * @property {Array.<MeshArea>} additiveAreas    -
 * @property {Array} associatedResources         -
 * @property {Array.<MeshArea>} decalAreas       -
 * @property {Array.<MeshArea>} depthAreas       -
 * @property {Tr2LodResource} geometryRes        -
 * @property {Array.<MeshArea>} opaqueAreas      -
 * @property {Array.<MeshArea>} pickableAreas    -
 * @property {Array.<MeshArea>} transparentAreas -
 */
export default class Tr2MeshLod extends Tw2BaseClass
{

    additiveAreas = [];
    associatedResources = [];
    decalAreas = [];
    depthAreas = [];
    geometryRes = null;
    opaqueAreas = [];
    pickableAreas = [];
    transparentAreas = [];

}

Tw2BaseClass.define(Tr2MeshLod, Type =>
{
    return {
        isStaging: true,
        type: "Tr2MeshLod",
        props: {
            additiveAreas: [["Tr2MeshArea"]],
            associatedResources: Type.ARRAY,
            decalAreas: [["Tr2MeshArea"]],
            depthAreas: [["Tr2MeshArea"]],
            geometryRes: ["Tr2LodResource"],
            opaqueAreas: [["Tr2MeshArea"]],
            pickableAreas: [["Tr2MeshArea"]],
            transparentAreas: [["Tr2MeshArea"]]
        }
    };
});

