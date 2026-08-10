/**
 * Installs the character demo's explicit no-SOF boot policy.
 *
 * Tw2Library asks the registered DNA handler for a boot value before falling
 * back to the combined SOF data.black. This demo never builds space-object
 * DNA, so a real empty EveSOFData is sufficient and no SOF resource is fetched.
 */
export function ConfigureCharacterDemoWithoutSof(tw2)
{
    if (!tw2 || typeof tw2.SetDnaHandler !== "function")
    {
        throw new TypeError("Character demo requires Tw2Library.SetDnaHandler");
    }

    const EveSOFData = GetClass(tw2, "EveSOFData") ?? tw2.EveSOFData;

    if (typeof EveSOFData !== "function")
    {
        throw new Error("The ccpwgl bundle does not register EveSOFData");
    }

    const data = new EveSOFData();
    const handler = async dna =>
    {
        if (dna !== null)
        {
            throw new Error("The character demo does not support space-object DNA");
        }
        return data;
    };

    tw2.SetDnaHandler(handler);
    return { data, handler };
}

function GetClass(tw2, name)
{
    try
    {
        return tw2.GetClass?.(name) ?? null;
    }
    catch
    {
        return null;
    }
}

export default ConfigureCharacterDemoWithoutSof;
