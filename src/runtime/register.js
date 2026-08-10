import {
    TnyApiService,
    TnyCharacterApiProvider,
    TnyESIApiProvider,
    TnySDEApiProvider,
    TnySkinApiProvider,
    TnyToolsApiProvider
} from "./api";
import { TnyCameraTest } from "./cameras";
import { TnyRotationGizmo, TnyScalingGizmo, TnyTransformGizmo, TnyTranslationGizmo } from "./debug";
import { TnyLensflare, TnyMoon, TnyPlanet, TnyShip, TnySpaceObject, TnyStrategicCruiser } from "./objects";
import { TnyClient } from "./TnyClient";
import { TnyScene } from "./TnyScene";


export const tnyObjectConstructors = {
    TnyLensflare,
    TnyMoon,
    TnyPlanet,
    TnyShip,
    TnySpaceObject,
    TnyStrategicCruiser
};

export const tnyCameraConstructors = {
    TnyCameraTest
};

export const tnySceneConstructors = {
    TnyScene
};

export const tnyDebugConstructors = {
    TnyRotationGizmo,
    TnyScalingGizmo,
    TnyTransformGizmo,
    TnyTranslationGizmo
};

export const tnyServiceConstructors = {
    TnyApiService,
    TnyCharacterApiProvider,
    TnyClient,
    TnyESIApiProvider,
    TnySDEApiProvider,
    TnySkinApiProvider,
    TnyToolsApiProvider
};

export const tnyConstructors = {
    ...tnyObjectConstructors,
    ...tnyCameraConstructors,
    ...tnySceneConstructors,
    ...tnyDebugConstructors,
    ...tnyServiceConstructors
};

export function RegisterTnyConstructors(tw2)
{
    if (!tw2 || !tw2.Register)
    {
        throw new TypeError("Invalid Tw2Library");
    }

    tw2.Register({ constructors: tnyConstructors });
    return tw2;
}
