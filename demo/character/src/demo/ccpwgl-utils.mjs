import { tw2 } from "./ccpwgl-global.mjs";

const InteriorScene = GetClass("Tr2InteriorScene");
const Model = InteriorScene && Object.getPrototypeOf(InteriorScene.prototype)?.constructor;

if (typeof Model !== "function")
{
    throw new Error("The ccpwgl bundle must register Tr2InteriorScene before character runtime modules load");
}

export const meta = { Model };

function GetClass(name)
{
    try
    {
        return tw2.GetClass?.(name) ?? tw2[name] ?? null;
    }
    catch
    {
        return tw2[name] ?? null;
    }
}
