import {Tw2BaseClass} from "../../class";

/**
 * Tr2MeshLod
 *
 * @parameter {Array.<MeshArea>} additiveAreas    -
 * @parameter {Array} associatedResources         -
 * @parameter {Array.<MeshArea>} decalAreas       -
 * @parameter {Array.<MeshArea>} depthAreas       -
 * @parameter {Tr2LodResource} geometryRes        -
 * @parameter {Array.<MeshArea>} opaqueAreas      -
 * @parameter {Array.<MeshArea>} pickableAreas    -
 * @parameter {Array.<MeshArea>} transparentAreas -
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

