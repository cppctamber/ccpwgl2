import assert from "node:assert/strict";
import test from "node:test";

import {
    ConfigureCharacterDemoWithoutSof
} from "../src/demo/CharacterDemoSofPolicy.mjs";

test("character demo installs an empty SOF boot without fetching SOF data", async () =>
{
    class EveSOFData {}

    let installedHandler = null;
    const tw2 = {
        GetClass(name)
        {
            return name === "EveSOFData" ? EveSOFData : null;
        },
        SetDnaHandler(handler)
        {
            installedHandler = handler;
        }
    };
    const configured = ConfigureCharacterDemoWithoutSof(tw2);

    assert.strictEqual(installedHandler, configured.handler);
    assert.ok(configured.data instanceof EveSOFData);
    assert.strictEqual(await installedHandler(null), configured.data);
    await assert.rejects(
        installedHandler("hull:faction:race"),
        /does not support space-object DNA/u
    );
});

test("character demo fails clearly when the SOF interception seam is absent", () =>
{
    assert.throws(
        () => ConfigureCharacterDemoWithoutSof({}),
        /requires Tw2Library\.SetDnaHandler/u
    );
    assert.throws(
        () => ConfigureCharacterDemoWithoutSof({
            SetDnaHandler() {},
            GetClass: () => null
        }),
        /does not register EveSOFData/u
    );
});
