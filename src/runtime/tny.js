import {
    TnyApiService,
    TnyCharacterApiProvider,
    TnyESIApiProvider,
    TnySDEApiProvider,
    TnySkinApiProvider,
    TnyToolsApiProvider
} from "./api";
import { TnyCameraTest } from "./cameras";
import { tnyCharacterConstructors } from "./character";
import { TnyRotationGizmo, TnyScalingGizmo, TnyTransformGizmo, TnyTranslationGizmo } from "./gizmo";
import {
    TnyLensflare, TnyMobile, TnyPlanet, TnyShip, TnySpaceObject, TnyStationary, TnyStrategicCruiser, TnySwarm
} from "./objects";
import { TnyClient } from "./TnyClient";
import { TnyScene } from "./TnyScene";


/**
 * Everything the Tny runtime can construct by name. This is the runtime's
 * store, not tw2's: Tny wrappers resolve through `tny.GetClass()` or
 * `scene.GetClass()`, and the engine classes they wrap through
 * `tw2.GetClass()`.
 */
export const tnyConstructors = {
    // Objects
    TnyLensflare,
    TnyMobile,
    TnyPlanet,
    TnyShip,
    TnySpaceObject,
    TnyStationary,
    TnyStrategicCruiser,
    TnySwarm,
    // Cameras
    TnyCameraTest,
    // Scenes — the character scene arrives with tnyCharacterConstructors
    TnyScene,
    ...tnyCharacterConstructors,
    // Debug
    TnyRotationGizmo,
    TnyScalingGizmo,
    TnyTransformGizmo,
    TnyTranslationGizmo,
    // Client and services
    TnyApiService,
    TnyCharacterApiProvider,
    TnyClient,
    TnyESIApiProvider,
    TnySDEApiProvider,
    TnySkinApiProvider,
    TnyToolsApiProvider
};

/**
 * The one Tny runtime object. Production code imports this rather than
 * constructing another client or discovering one through a global.
 */
export const tny = new TnyClient();

// Registered on the class, not the instance: scenes fetch their own objects
// and resolve a `type` name through `TnyClient.GetClass` without needing one.
TnyClient.register({ constructors: tnyConstructors });
