// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionAttributeModifiers/IEveDistributionModifier.h
import { meta } from "utils";
import { quat, vec3 } from "math";


/**
 * One generated placement in a distribution: the initial transform the generator
 * produced, the extra translation, rotation and scale the attribute modifiers
 * have accumulated, and the identity and lifetime that let those modifiers
 * recognise the same placement between frames.
 */
@meta.type("PlacementDataWithIdentifier")
@meta.ccp.define("PlacementDataWithIdentifier")
export class PlacementDataWithIdentifier extends meta.Model
{

    @meta.vector3
    initialTranslation = vec3.create();

    @meta.quaternion
    initialRotation = quat.create();

    @meta.vector3
    initialScale = vec3.fromValues(1, 1, 1);

    @meta.vector3
    additionalTranslation = vec3.create();

    @meta.vector3
    translationFrameDelta = vec3.create();

    @meta.quaternion
    additionalRotation = quat.create();

    @meta.vector3
    additionalScale = vec3.fromValues(1, 1, 1);

    @meta.int32
    boneIndex = -1;

    @meta.float
    lifeTime = 0;

    @meta.uint
    uniqueID = 0;

    @meta.int32
    initialPlacementID = -1;

}
