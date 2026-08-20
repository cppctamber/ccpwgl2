import assert from "node:assert/strict";
import test from "node:test";

import { InstallCharacterDemoGrannyStateResource } from
    "../src/demo/CharacterDemoGrannyStateResource.mjs";

test("character demo installs the exported GState resource and can restore its predecessor", async () =>
{
    class PreviousGsfResource {}
    class Tr2GrannyStateRes
    {
        async WaitForAnimationResources()
        {
            return this;
        }
    }

    const extensions = new Map([ [ "gsf", PreviousGsfResource ] ]);
    const tw2 = {
        Tr2GrannyStateRes,
        GetExtension: extension => extensions.get(extension),
        SetExtension(extension, Resource)
        {
            extensions.set(extension, Resource);
        },
        resMan: {
            async FetchResource()
            {
                return new (extensions.get("gsf"))();
            }
        }
    };

    const installation = InstallCharacterDemoGrannyStateResource(tw2);
    const resource = await installation.Load("res:/character.gsf");

    assert.equal(installation.available, true);
    assert.equal(extensions.get("gsf"), Tr2GrannyStateRes);
    assert.ok(resource instanceof Tr2GrannyStateRes);
    installation.Restore();
    assert.equal(extensions.get("gsf"), PreviousGsfResource);
});

test("character demo remains usable until a concurrent bundle exposes the class", async () =>
{
    class PreviousGsfResource {}
    const extensions = new Map([ [ "gsf", PreviousGsfResource ] ]);
    const installation = InstallCharacterDemoGrannyStateResource({
        GetExtension: extension => extensions.get(extension),
        SetExtension(extension, Resource)
        {
            extensions.set(extension, Resource);
        },
        resMan: {
            async FetchResource()
            {
                throw new Error("not reached");
            }
        }
    });

    assert.equal(installation.available, false);
    assert.equal(extensions.get("gsf"), PreviousGsfResource);
    await assert.rejects(() => installation.Load("res:/character.gsf"), /does not export/iu);
});
