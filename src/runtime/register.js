import { TnyApiService, TnyESIApiProvider, TnySDEApiProvider } from "./api";
import { TnyCameraTest } from "./cameras";
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

export const tnyServiceConstructors = {
    TnyApiService,
    TnyClient,
    TnyESIApiProvider,
    TnyResService,
    TnySDEApiProvider
};

export const tnyConstructors = {
    ...tnyObjectConstructors,
    ...tnyCameraConstructors,
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
