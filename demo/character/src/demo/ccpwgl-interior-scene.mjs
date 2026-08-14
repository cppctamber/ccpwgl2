import { tw2 } from "./ccpwgl-global.mjs";

let Tr2InteriorScene;

try
{
    Tr2InteriorScene = tw2.GetClass?.("Tr2InteriorScene") ?? tw2.Tr2InteriorScene;
}
catch
{
    Tr2InteriorScene = tw2.Tr2InteriorScene;
}

if (typeof Tr2InteriorScene !== "function")
{
    throw new Error("The ccpwgl bundle must register Tr2InteriorScene before character runtime modules load");
}

export { Tr2InteriorScene };
