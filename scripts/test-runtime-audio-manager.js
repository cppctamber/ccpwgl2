const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const source = fs.readFileSync(
    path.resolve(__dirname, "../src/core/engine/Tw2AudioMan.js"),
    "utf8",
)
    .replace(/^import[\s\S]*?from .*;$/gm, "")
    .replace("export class", "class");

let Tw2AudioMan;
let fakeTw2;

function assignIfExists(destination, sourceValue, keys)
{
    for (const key of keys)
    {
        if (sourceValue?.[key] !== undefined)
        {
            destination[key] = sourceValue[key];
        }
    }
}

test.before(async () =>
{
    const { CjsAudioMan } =
        await import("@carbonenginejs/runtime-audio");
    const { vec3, mat4 } = require("gl-matrix");

    fakeTw2 = {
        paths: {
            map: {
                res: "https://res.test/",
                aud: "https://tools.test/eve/3435006/audio/",
            },
            Has(key)
            {
                return key in this.map;
            },
            Resolve(value)
            {
                const index = value.indexOf(":/");
                const prefix = value.slice(0, index);

                if (!(prefix in this.map))
                {
                    throw new Error(`Undefined resource prefix: ${prefix}`);
                }
                return this.map[prefix] + value.slice(index + 2);
            },
        },
        resMan: {
            fetched: [],
            resources: {},
            async Fetch(resourcePath)
            {
                this.fetched.push(resourcePath);

                if (!(resourcePath in this.resources))
                {
                    throw new Error(
                        `Fake resMan has no resource: ${resourcePath}`,
                    );
                }
                return {
                    data: this.resources[resourcePath],
                };
            },
            BuildUrl(value)
            {
                return fakeTw2.paths.Resolve(value);
            },
        },
    };

    Tw2AudioMan = new Function(
        "CjsAudioMan",
        "vec3",
        "mat4",
        "assignIfExists",
        "tw2",
        `${source}\nreturn Tw2AudioMan;`,
    )(
        CjsAudioMan,
        vec3,
        mat4,
        assignIfExists,
        fakeTw2,
    );
});

function FakeParam()
{
    return {
        value: 0,
        linearRampToValueAtTime() {},
    };
}

function FakeContext(log)
{
    return {
        currentTime: 0,
        state: "running",
        destination: {},
        listener: {
            positionX: FakeParam(),
            positionY: FakeParam(),
            positionZ: FakeParam(),
            forwardX: FakeParam(),
            forwardY: FakeParam(),
            forwardZ: FakeParam(),
            upX: FakeParam(),
            upY: FakeParam(),
            upZ: FakeParam(),
        },
        createGain()
        {
            return {
                gain: FakeParam(),
                connect() {},
                disconnect() {},
            };
        },
        createPanner()
        {
            return {
                positionX: FakeParam(),
                positionY: FakeParam(),
                positionZ: FakeParam(),
                orientationX: FakeParam(),
                orientationY: FakeParam(),
                orientationZ: FakeParam(),
                connect() {},
                disconnect() {},
            };
        },
        createBufferSource()
        {
            const node = {
                buffer: null,
                loop: false,
                onended: null,
                connect() {},
                start()
                {
                    log.push("start");
                },
                stop()
                {
                    node.onended?.();
                },
            };

            return node;
        },
        decodeAudioData(bytes)
        {
            log.push([ "decode", [ ...new Uint8Array(bytes) ] ]);
            return Promise.resolve({
                sampleRate: 48000,
                getChannelData()
                {
                    return new Float32Array(0);
                },
            });
        },
        close()
        {
            this.state = "closed";
        },
    };
}

function CreateLibrary()
{
    return {
        schema: "carbonenginejs.audioLibrary",
        schemaVersion: 2,
        metadata: {
            Events: {
                engine_loop: {
                    eventID: 11,
                    maxRadiusAttenuation: 500,
                    isLoop: 1,
                    is2D: 0,
                    isVital: 0,
                    eventsStoppedBy: [],
                    soundbanks: [ "ships.bnk" ],
                },
                voice_line: {
                    eventID: 12,
                    maxRadiusAttenuation: 0,
                    isLoop: 0,
                    is2D: 1,
                    isVital: 0,
                    eventsStoppedBy: [],
                    soundbanks: [ "voice.bnk" ],
                },
            },
            SoundBanks: {
                "ships.bnk": {
                    EssentialSoundBank: 0,
                },
                "voice.bnk": {
                    EssentialSoundBank: 0,
                },
            },
            WemFileIDs: {},
        },
        media: {
            "101": {
                sourceID: "media:101",
                resPath: "res:/audio/media/101.ogg",
                byteLength: 4,
                mediaType: "ogg",
                language: "",
            },
        },
        banks: {
            "900:1": {
                sourceID: "900:1",
                bankID: "900",
                languageID: "1",
                language: "en-us",
                resPath: "res:/audio/voice.bnk",
                byteLength: 12,
            },
        },
        eventMedia: {
            engine_loop: [ "101" ],
            voice_line: [ "202" ],
        },
        embeddedMedia: {
            "202": {
                sourceID: "embedded:202:900:1",
                bank: "900:1",
                offset: 4,
                byteLength: 4,
                language: "en-us",
                mediaType: "ogg",
            },
        },
    };
}

test("CCPWGL delegates installed documents and individual decoding to CjsAudioMan", async () =>
{
    const log = [];
    let contexts = 0;
    const requests = [];

    const audMan = new Tw2AudioMan();

    audMan.Register({
        createContext: () =>
        {
            contexts++;
            return FakeContext(log);
        },
        fetch: async url =>
        {
            requests.push(url);
            return {
                ok: true,
                status: 200,
                arrayBuffer: async () =>
                    Uint8Array.from([ 1, 2, 3, 4 ]).buffer,
            };
        },
    });
    audMan.InstallLibrary(CreateLibrary());

    assert.equal(Object.isFrozen(audMan.library), true);
    assert.equal(audMan.listener, audMan.audio.listener);

    const emitter = audMan.CreateEmitter({
        name: "Engine_SFX",
        position: [ 10, 0, 0 ],
    });

    assert.equal(contexts, 0);
    assert.equal(emitter.SendEvent("engine_loop", true), 0);
    assert.equal(audMan.Enable(), true);
    assert.equal(contexts, 1);
    assert.equal(audMan.listener, audMan.audio.listener);

    await audMan.audio.LoadMedia(101);
    assert.deepEqual(
        log.find(value => Array.isArray(value))?.[1],
        [ 1, 2, 3, 4 ],
    );
    assert.equal(requests.length, 1);
    assert.match(
        requests[0],
        /\/audio\/path\/res%3A%2Faudio%2Fmedia%2F101\.ogg$/u,
    );
    assert.equal(audMan.ReleaseEmitter(emitter), true);
    audMan.Dispose();
});

test("embedded media uses exact ranges when verified and whole banks otherwise", async () =>
{
    const bank = Uint8Array.from([
        0, 1, 2, 3,
        4, 5, 6, 7,
        8, 9, 10, 11,
    ]);
    const rangeLog = [];
    const requests = [];

    {
        const ranged = new Tw2AudioMan();

        ranged.Register({
            createContext: () => FakeContext(rangeLog),
            fetch: async (url, options = {}) =>
            {
                requests.push({
                    url,
                    method: options.method ?? "GET",
                    range: options.headers?.Range ?? null,
                });

                return {
                    ok: true,
                    status: 206,
                    headers: {
                        get: name =>
                            name === "accept-ranges" ? "bytes" : null,
                    },
                    arrayBuffer: async () =>
                        bank.slice(4, 8).buffer,
                };
            },
        });
        ranged.InstallLibrary(CreateLibrary());

        assert.equal(
            (await ranged.DetectMediaSourcing()).ranges,
            true,
        );
        assert.equal(ranged.Enable(), true);
        await ranged.audio.LoadMedia(202);
        assert.equal(requests[1].range, "bytes=4-7");
        assert.deepEqual(
            rangeLog.find(value => Array.isArray(value))?.[1],
            [ 4, 5, 6, 7 ],
        );
        ranged.Dispose();

        const wholeLog = [];
        const whole = new Tw2AudioMan();

        whole.Register({
            allowOffsets: false,
            createContext: () => FakeContext(wholeLog),
            fetch: async () => ({
                ok: true,
                status: 200,
                arrayBuffer: async () => bank.buffer,
            }),
        });
        whole.InstallLibrary(CreateLibrary());
        assert.equal(whole.Enable(), true);
        await whole.audio.LoadMedia(202);
        assert.deepEqual(
            wholeLog.find(value => Array.isArray(value))?.[1],
            [ 4, 5, 6, 7 ],
        );
        whole.Dispose();
    }
});

test("tracked emitters and listener placement remain in the CCPWGL facade", () =>
{
    const audMan = new Tw2AudioMan();

    audMan.Register({
        createContext: () => FakeContext([]),
    });
    audMan.InstallLibrary(CreateLibrary());
    audMan.Enable();

    const emitter = audMan.CreateEmitter({
        name: "tracked",
    });
    const target = {
        GetWorldTransform(out)
        {
            out.set([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                100, 200, 300, 1,
            ]);
            return out;
        },
    };

    audMan.TrackEmitter(emitter, target, [ 1, 2, 3 ]);
    audMan.Tick();
    assert.deepEqual(
        [ ...emitter.GetPosition() ],
        [ 101, 202, 303 ],
    );

    audMan.listenerFromCamera = false;
    audMan.SetAudioLocationFromPoseMatrix([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        5, 6, 7, 1,
    ]);
    audMan.Tick();
    assert.deepEqual(
        [
            audMan.context.listener.positionX.value,
            audMan.context.listener.positionY.value,
            audMan.context.listener.positionZ.value,
        ],
        [ 5, 6, 7 ],
    );
    audMan.Dispose();
});

test("high-level audio controls delegate to CjsAudioMan", () =>
{
    const audMan = new Tw2AudioMan();

    audMan.Register({
        createContext: () => FakeContext([]),
    });
    audMan.InstallLibrary(CreateLibrary());

    assert.equal(audMan.LoadSoundBank("voice.bnk"), "voice.bnk");
    assert.deepEqual(
        audMan.audio.banksWaitingToLoad,
        [ "voice.bnk" ],
    );
    assert.equal(audMan.Enable({ soundBanks: [] }), true);
    assert.equal(audMan.SetGlobalRTPC("volume", 0.5), true);
    assert.equal(audMan.SetState("ship", "warping"), true);
    assert.deepEqual(
        audMan.SwapSoundBanks([ "ships.bnk" ]),
        {
            loaded: [ "ships.bnk" ],
            unloaded: [ "voice.bnk" ],
        },
    );
    assert.deepEqual(
        audMan.GetLoadedSoundBanks().sort(),
        [ "Init.bnk", "ships.bnk" ],
    );

    audMan.StopAllPlayingSounds();
    audMan.Dispose();
});

test("fetches and installs a complete document without the builder", async () =>
{
    const document = CreateLibrary();
    const audMan = new Tw2AudioMan();
    audMan.Register({
        fetch: async url =>
        {
            assert.equal(
                url,
                "https://tools.test/eve/3435006/audio/library.json",
            );
            return {
                ok: true,
                status: 200,
                json: async () => document,
            };
        },
    });
    const installed = await audMan.FetchLibrary();

    assert.equal(installed, audMan.library);
    assert.notEqual(installed, document);
    assert.equal(Object.isFrozen(installed), true);
});

test("audio is unavailable when no tools-core endpoint is configured", async () =>
{
    const endpoint = fakeTw2.paths.map.aud;
    delete fakeTw2.paths.map.aud;

    try
    {
        const audMan = new Tw2AudioMan();
        await assert.rejects(
            () => audMan.FetchLibrary(),
            /no tools-core aud: endpoint is configured/u,
        );

        audMan.InstallLibrary(CreateLibrary());
        const report = await audMan.DetectMediaSourcing();

        assert.equal(report.supported, false);
        assert.match(
            report.reason,
            /no tools-core aud: endpoint is configured/u,
        );
    }
    finally
    {
        fakeTw2.paths.map.aud = endpoint;
    }
});
