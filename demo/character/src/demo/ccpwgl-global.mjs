const tw2 = globalThis.tw2;
const tiny = globalThis.tiny;
const tny = globalThis.tny;

if (!tw2)
{
    throw new Error("The ccpwgl bundle must load before the character runtime modules");
}

export { tw2 };
export { tiny };
export { tny };
