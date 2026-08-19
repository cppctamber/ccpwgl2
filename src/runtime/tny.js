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
import { TnyLensflare, TnyMoon, TnyPlanet, TnyShip, TnySpaceObject, TnyStrategicCruiser } from "./objects";
import { TnyClient } from "./TnyClient";
import { TnyScene } from "./TnyScene";


/**
 * Everything the Tny runtime can construct by name. This is the client's
 * store, not tw2's: Tny wrappers resolve through `tny.GetClass()` and the
 * engine classes they wrap through `tw2.GetClass()`.
 */
export const tnyConstructors = {
    // Objects
    TnyLensflare,
    TnyMoon,
    TnyPlanet,
    TnyShip,
    TnySpaceObject,
    TnyStrategicCruiser,
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
tny.Register({ constructors: tnyConstructors });
