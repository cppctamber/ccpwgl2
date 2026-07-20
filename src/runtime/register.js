import {
    TnyApiService,
    TnyCharacterApiProvider,
    TnyESIApiProvider,
    TnySDEApiProvider,
    TnySkinApiProvider
} from "./api";
import { TnyCameraTest } from "./cameras";
import { TnyRotationGizmo, TnyScalingGizmo, TnyTransformGizmo, TnyTranslationGizmo } from "./debug";
import { TnyLensflare, TnyPlanet, TnyShip, TnySpaceObject, TnyStrategicCruiser } from "./objects";
import { TnyResService } from "./providers";
import { TnyClient } from "./TnyClient";


export const tnyObjectConstructors = {
    TnyLensflare,
    TnyPlanet,
    TnyShip,
    TnySpaceObject,
    TnyStrategicCruiser
};

export const tnyCameraConstructors = {
    TnyCameraTest
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
    TnyResService,
    TnySDEApiProvider,
    TnySkinApiProvider
};

export const tnyConstructors = {
    ...tnyObjectConstructors,
    ...tnyCameraConstructors,
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
