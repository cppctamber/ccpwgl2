const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const sourcePath = path.resolve(__dirname, "../src/core/engine/Tw2AudioMan.js");
const source = fs.readFileSync(sourcePath, "utf8")
    .replace(/^import .*$/gm, "")
    .replace("export class", "class");

let Tw2AudioMan;

function assignIfExists(dest, src, keys)
{
    for (const key of keys)
    {
        if (src && src[key] !== undefined) dest[key] = src[key];
    }
}

test.before(async () =>
{
    const { CjsAudioSystem, AudListener } = await import("@carbonenginejs/runtime-audio");
    const { CjsWemFormat } = await import("@carbonenginejs/runtime-resource/formats/wem");
    const { vec3, mat4 } = require("gl-matrix");
    Tw2AudioMan = new Function(
        "CjsAudioSystem", "AudListener", "CjsWemFormat", "vec3", "mat4", "assignIfExists",
        `${source}\nreturn Tw2AudioMan;`
    )(CjsAudioSystem, AudListener, CjsWemFormat, vec3, mat4, assignIfExists);
});

function FakeParam()
{
    return { value: 0 };
}

function FakeContext(log)
{
    return {
        currentTime: 0,
        state: "running",
        destination: { name: "destination" },
        listener: {
            positionX: FakeParam(), positionY: FakeParam(), positionZ: FakeParam(),
            forwardX: FakeParam(), forwardY: FakeParam(), forwardZ: FakeParam(),
            upX: FakeParam(), upY: FakeParam(), upZ: FakeParam()
        },
        createGain()
        {
            return {
                gain: { value: 1, linearRampToValueAtTime: () => log.push("fade") },
                connect: () => {}, disconnect: () => {}
            };
        },
        createPanner()
        {
            const panner = {
                panningModel: "", distanceModel: "", refDistance: 1,
                positionX: FakeParam(), positionY: FakeParam(), positionZ: FakeParam(),
                orientationX: FakeParam(), orientationY: FakeParam(), orientationZ: FakeParam(),
                connect: () => {}, disconnect: () => {}
            };
            log.push(panner);
            return panner;
        },
        createBufferSource()
        {
            const bufferSource = {
                buffer: null, loop: false, onended: null,
                connect: () => {},
                start: () => log.push("start"),
                stop: () => { log.push("stop"); bufferSource.onended?.(); }
            };
            log.push(bufferSource);
            return bufferSource;
        }
    };
}

function CreateLibrary()
{
    return {
        schema: "carbonenginejs.audioLibrary",
        schemaVersion: 2,
        metadata: {
            Events: {
                engine_loop: { eventID: 11, maxRadiusAttenuation: 500, isLoop: 1, is2D: 0, isVital: 0, eventsStoppedBy: [], soundbanks: [ "ships.bnk" ] },
                voice_line: { eventID: 12, maxRadiusAttenuation: 0, isLoop: 0, is2D: 1, isVital: 0, eventsStoppedBy: [], soundbanks: [ "voice.bnk" ] },
                control_only: { eventID: 13, maxRadiusAttenuation: 0, isLoop: 0, is2D: 1, isVital: 0, eventsStoppedBy: [], soundbanks: [ "ships.bnk" ] }
            },
            SoundBanks: { "ships.bnk": { EssentialSoundBank: 0 }, "voice.bnk": { EssentialSoundBank: 0 } },
            WemFileIDs: {}
        },
        media: {
            "101": { resPath: "res:/audio/media/101.wem", storagePath: "aa/loose_101", byteLength: 4, checksum: "x", language: "" }
        },
        banks: {
            "900:1": { sourceID: "900:1", bankID: "900", languageID: "1", language: "en-us", shortName: "Voice", resPath: "res:/audio/voice.bnk", storagePath: "bb/bank_900_en", byteLength: 16 },
            "900:2": { sourceID: "900:2", bankID: "900", languageID: "2", language: "de", shortName: "Voice", resPath: "res:/audio/voice.bnk", storagePath: "bb/bank_900_de", byteLength: 16 }
        },
        eventMedia: {
            engine_loop: [ "101" ],
            voice_line: [ "202" ],
            control_only: [],
            single_sfx: [ "303" ]
        },
        embeddedMedia: {
            "202": [
                { sourceID: "embedded:1:900:2", bank: "900:2", offset: 2, byteLength: 4, language: "de", mediaType: "wem" },
                { sourceID: "embedded:1:900:1", bank: "900:1", offset: 4, byteLength: 4, language: "en-us", mediaType: "wem" }
            ],
            "303": { sourceID: "embedded:303:900:1", bank: "900:1", offset: 8, byteLength: 4, language: "", mediaType: "wem" }
        }
    };
}

test("stays headless until Enable and then realizes the listener and emitters", async () =>
{
    const log = [];
    let contexts = 0;
    const audMan = new Tw2AudioMan(); audMan.Register({
        createContext: () => { contexts++; return FakeContext(log); },
        loadBuffer: async () => ({ fake: "buffer" })
    });

    audMan.SetLibrary(CreateLibrary());
    const emitter = audMan.CreateEmitter({ name: "Engine_SFX", prefix: "ship_engine_S_", position: [ 10, 0, 0 ] });

    assert.equal(contexts, 0, "no AudioContext before Enable");
    assert.equal(audMan.enabled, false);
    assert.equal(emitter.SendEvent("engine_loop", true), 0, "headless posts queue and return 0");
    audMan.Tick();

    try
    {
        assert.equal(audMan.Enable(), true);
        assert.equal(contexts, 1);
        assert.equal(audMan.state, "running");
        assert.equal(audMan.system.manager.GetSoundBankStatus("ships.bnk"), "loaded");
        assert.equal(audMan.system.manager.GetListener(), audMan.listener, "listener registered with the manager");

        audMan.SetAudioLocationFromPoseMatrix([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            5, 6, 7, 1
        ]);
        audMan.Tick();
        const listener = audMan.context.listener;
        assert.deepEqual(
            [ listener.positionX.value, listener.positionY.value, listener.positionZ.value ],
            [ 5, 6, 7 ]);
        assert.deepEqual(
            [ listener.forwardX.value, listener.forwardY.value, listener.forwardZ.value ],
            [ -0, -0, -1 ]);

        const playingID = emitter.SendEvent("engine_loop", true);
        assert.ok(playingID > 0, "live post returns a playing id");
        await new Promise(resolve => setImmediate(resolve));
        assert.ok(log.includes("start"), "buffer source started");

        assert.equal(audMan.FindSoundEmitter("Engine_SFX"), emitter);
        assert.equal(audMan.GetSoundEmitter("Engine_SFX"), emitter);
        assert.equal(audMan.ReleaseEmitter(emitter), true);
        assert.equal(audMan.FindSoundEmitter("Engine_SFX"), null);
    }
    finally
    {
        audMan.system.Detach();
    }
});

test("resolves event media through library edges, loose media and bank slices", async () =>
{
    const fetched = [];
    const bankBytes = Uint8Array.from([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 ]);
    const audMan = new Tw2AudioMan(); audMan.Register({
        resourceBaseUrl: "https://cdn.test/",
        fetch: async url =>
        {
            fetched.push(url);
            return { ok: true, arrayBuffer: async () => bankBytes.slice().buffer };
        }
    });
    audMan.SetLibrary(CreateLibrary());

    assert.equal(audMan.ResolveEventMedia("engine_loop"), "101");
    assert.equal(audMan.ResolveEventMedia("voice_line"), "202");
    assert.equal(audMan.ResolveEventMedia("control_only"), null, "no HIRC edges resolves to silence");
    assert.equal(audMan.ResolveEventMedia("unknown_event"), null);

    const loose = await audMan.FetchWemBytes("101");
    assert.equal(fetched[0], "https://cdn.test/aa/loose_101");
    assert.equal(loose.length, 16);

    const embedded = await audMan.FetchWemBytes("202");
    assert.equal(fetched[1], "https://cdn.test/bb/bank_900_en", "preferred language variant picks its bank");
    assert.deepEqual([ ...embedded ], [ 4, 5, 6, 7 ], "bank slice honors offset and byteLength");

    await audMan.FetchWemBytes("202");
    assert.equal(fetched.length, 2, "bank bytes are fetched once");

    const single = await audMan.FetchWemBytes("303");
    assert.deepEqual([ ...single ], [ 8, 9, 10, 11 ], "single-variant embedded records are plain objects, not arrays");

    audMan.Register({ language: "de" });
    audMan.SetLibrary(CreateLibrary());
    const german = await audMan.FetchWemBytes("202");
    assert.equal(fetched[2], "https://cdn.test/bb/bank_900_de");
    assert.deepEqual([ ...german ], [ 2, 3, 4, 5 ]);

    await assert.rejects(() => audMan.FetchWemBytes("999"), /not found in library/);
});

test("tracked emitters follow their target's world transform each tick", () =>
{
    const log = [];
    const audMan = new Tw2AudioMan(); audMan.Register({
        createContext: () => FakeContext(log),
        loadBuffer: async () => ({ fake: "buffer" })
    });
    audMan.SetLibrary(CreateLibrary());
    audMan.Enable();

    const emitter = audMan.CreateEmitter({ name: "Engine_SFX", position: [ 1, 2, 3 ] });
    const target = {
        transform: [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            100, 200, 300, 1
        ],
        GetWorldTransform(out)
        {
            out.set(this.transform);
            return out;
        }
    };

    assert.throws(() => audMan.TrackEmitter(emitter, {}), /GetWorldTransform/);
    audMan.TrackEmitter(emitter, target, [ 1, 2, 3 ]);
    audMan.Tick();
    assert.deepEqual([ ...emitter.GetPosition() ], [ 101, 202, 303 ]);

    target.transform[12] = -50;
    audMan.Tick();
    assert.deepEqual([ ...emitter.GetPosition() ], [ -49, 202, 303 ]);

    assert.equal(audMan.ReleaseEmitter(emitter), true);
    assert.equal(audMan.UntrackEmitter(emitter), false, "release also untracks");
    audMan.system.Detach();
});

test("EveSOFData.SetupAudio builds tracked hull emitters", () =>
{
    const sofSource = fs.readFileSync(path.resolve(__dirname, "../src/sof/EveSOFData.js"), "utf8");
    const start = sofSource.indexOf("static SetupAudio");
    const body = sofSource.slice(start, sofSource.indexOf("static SetupAnimations"));

    assert.match(body, /soundEmitters = \[\], audioPosition/, "reads hull sound emitters and audio position");
    assert.match(body, /tw2\.audMan\.ReleaseEmitter/, "releases previous emitters on rebuild");
    assert.match(body, /tw2\.audMan\.CreateEmitter/, "creates emitters through the audio manager");
    assert.match(body, /tw2\.audMan\.TrackEmitter\(emitter, obj, source\.position\)/, "tracks emitters against the object");
    assert.match(body, /obj\.audioEmitters\.push/, "exposes emitters for FindSoundEmitter discovery");
    assert.doesNotMatch(body, /not implemented/i);
});

test("a mediaUrl endpoint short-circuits loose and embedded resolution", async () =>
{
    const fetched = [];
    const audMan = new Tw2AudioMan(); audMan.Register({
        mediaUrl: (id, lib) => `https://tools.test/eve/${lib.sourceBuild}/audio/id/${id}`,
        fetch: async url =>
        {
            fetched.push(url);
            return { ok: true, arrayBuffer: async () => new Uint8Array([ 1, 2 ]).buffer };
        }
    });
    audMan.SetLibrary({ ...CreateLibrary(), sourceBuild: "3435006" });

    await audMan.FetchWemBytes("101");
    await audMan.FetchWemBytes("202");
    assert.deepEqual(fetched, [
        "https://tools.test/eve/3435006/audio/id/101",
        "https://tools.test/eve/3435006/audio/id/202"
    ], "both loose and embedded ids go straight to the media endpoint");
});

test("rejects invalid libraries and reports fetch failures", async () =>
{
    const audMan = new Tw2AudioMan(); audMan.Register({
        fetch: async () => ({ ok: false, status: 404 })
    });

    assert.throws(() => audMan.SetLibrary({}), /carbonenginejs\.audioLibrary/);
    assert.throws(() => audMan.SetLibrary(null), /carbonenginejs\.audioLibrary/);

    audMan.SetLibrary(CreateLibrary());
    await assert.rejects(() => audMan.FetchWemBytes("101"), /fetch failed \(404\)/);
});
