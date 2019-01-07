import {Tw2StagingClass} from "../../class";

/**
 * Tw2MeshLod
 * @ccp Tr2MeshLod
 *
 * @parameter {Array.<MeshArea>} additiveAreas    -
 * @parameter {Array} associatedResources         -
 * @parameter {Array.<MeshArea>} decalAreas       -
 * @parameter {Array.<MeshArea>} depthAreas       -
 * @parameter {Tw2LodResource} geometryRes        -
 * @parameter {Array.<MeshArea>} opaqueAreas      -
 * @parameter {Array.<MeshArea>} pickableAreas    -
 * @parameter {Array.<MeshArea>} transparentAreas -
 */
export default class Tw2MeshLod extends Tw2StagingClass
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

Tw2StagingClass.define(Tw2MeshLod, Type =>
{
    return {
        type: "Tw2MeshLod",
        props: {
            additiveAreas: [["Tw2MeshArea"]],
            associatedResources: Type.ARRAY,
            decalAreas: [["Tw2MeshArea"]],
            depthAreas: [["Tw2MeshArea"]],
            geometryRes: ["Tw2LodResource"],
            opaqueAreas: [["Tw2MeshArea"]],
            pickableAreas: [["Tw2MeshArea"]],
            transparentAreas: [["Tw2MeshArea"]]
        }
    };
});

