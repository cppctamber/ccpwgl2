import { vec3, mat4 } from "math";
import { tw2 } from "global";
import { assignIfExists } from "utils";
import { CjsAudioMan } from "@carbonenginejs/runtime-audio";

/**
 * CCPWGL integration facade over `@carbonenginejs/runtime-audio`.
 *
 * Runtime-audio owns the installed document, source selection, original-bank
 * range or whole-file delivery, WEM preparation, decoded buffers, Carbon
 * manager, and Web Audio backend. This facade adds the tools-core `aud:`
 * endpoint adapter, listener/camera placement, and emitter name/tracking
 * helpers.
 */
export class Tw2AudioMan
{
    audio = null;

    listener = null;

    context = null;

    forward = vec3.fromValues(0, 0, -1);

    up = vec3.fromValues(0, 1, 0);

    position = vec3.create();

    language = "en-us";

    distanceScale = 1;

    listenerFromCamera = true;

    allowOffsets = true;

    rangeSupport = false;

    fetch = null;

    createContext = null;

    _emittersByName = new Map();

    _tracked = new Map();

    _dirty = true;

    _gestureHooked = false;

    _activeCamera = null;

    /** Gets the runtime-audio low-level system. */
    get system()
    {
        return this.audio?.system ?? null;
    }

    /** Gets the installed immutable audio-library document. */
    get library()
    {
        return this.audio?.library ?? null;
    }

    /** Gets whether the underlying Carbon manager is enabled. */
    get enabled()
    {
        return Boolean(this.audio?.manager?.enabled);
    }

    /** Gets the browser audio-context state. */
    get state()
    {
        return this.context
            ? this.context.state
            : Tw2AudioMan.State.NO_CONTEXT;
    }

    /**
     * Registers integration options.
     * @param {Object} opt Options.
     */
    Register(opt)
    {
        if (!opt)
        {
            return;
        }

        assignIfExists(this, opt, [
            "language",
            "distanceScale",
            "listenerFromCamera",
            "allowOffsets",
            "fetch",
            "createContext",
        ]);

        this.audio?.SetLanguages([ this.language ]);

        if (opt.library)
        {
            this.InstallLibrary(opt.library);
        }
    }

    /**
     * Fetches and installs a complete document from the configured tools-core
     * audio endpoint.
     * @param {String} [path="aud:/library.json"] Resource path.
     * @return {Promise<Object>} Installed immutable document.
     */
    async FetchLibrary(path = "aud:/library.json")
    {
        const url = this._ResolveAudioEndpoint(path);
        const response = await this._GetFetch()(url);

        if (!response.ok)
        {
            throw new Error(
                `Audio library unavailable (${response.status}): ${url}`,
            );
        }

        this.InstallLibrary(await response.json());
        return this.library;
    }

    /**
     * Installs one complete audio-library document in CjsAudioMan.
     * @param {Object} library Complete plain document.
     * @return {Tw2AudioMan} This manager.
     */
    InstallLibrary(library)
    {
        const audio = this._EnsureAudio();

        audio.InstallLibrary(library);
        this.listener = audio.listener;
        this._dirty = true;
        return this;
    }

    /**
     * Probes exact-path HTTP range delivery for original bank members.
     * Whole-file acquisition remains the safe fallback.
     * @return {Promise<Object>} Capability report.
     */
    async DetectMediaSourcing()
    {
        const source = this._GetProbeSource();
        const declared = Boolean(source);
        const report = {
            supported: declared,
            declared,
            verified: false,
            reason: null,
            ranges: false,
            fallback: "whole",
        };

        if (!source)
        {
            report.reason = "no audio library source available to probe";
            this.rangeSupport = false;
            return report;
        }
        if (!this.allowOffsets)
        {
            report.reason = "offset delivery disabled";
            this.rangeSupport = false;
            return report;
        }

        try
        {
            const url = this._ResolveSourceUrl(source);
            const doFetch = this._GetFetch();
            const response = await doFetch(url, {
                method: "HEAD",
                headers: {
                    Range: "bytes=0-0",
                },
            });

            report.supported = response.ok || response.status === 206;
            report.verified = report.supported;
            report.ranges = response.status === 206
                || String(
                    response.headers?.get?.("accept-ranges") ?? "",
                ).includes("bytes");
            if (!report.supported)
            {
                report.reason = `audio source answered ${response.status}`;
            }
        }
        catch (error)
        {
            report.supported = false;
            report.reason = error?.message ?? "audio source unreachable";
        }

        this.rangeSupport = report.ranges;
        return report;
    }

    /**
     * Creates the context and enables runtime-audio from a user gesture.
     * @param {Object} [opt] Options.
     * @param {Array<String>} [opt.soundBanks] Banks to mark loaded.
     * @return {Boolean} Whether audio enabled.
     */
    Enable({ soundBanks } = {})
    {
        const audio = this._EnsureAudio();
        const banks = soundBanks
            ?? Object.keys(this.library?.metadata?.SoundBanks ?? {});
        const enabled = audio.Enable(banks);

        this.Resume();
        this.listener = audio.listener;
        this._dirty = true;

        return enabled;
    }

    /** Disables the audio graph while retaining the browser context. */
    Disable()
    {
        this.audio?.Disable();
    }

    /**
     * Adds and loads one protected default soundbank.
     * @param {String} soundBankName Soundbank name.
     * @return {String} Normalized bank name.
     */
    AddAndLoadDefaultSoundBank(soundBankName)
    {
        return this._EnsureAudio()
            .AddAndLoadDefaultSoundBank(soundBankName);
    }

    /**
     * Removes and unloads one protected default soundbank.
     * @param {String} soundBankName Soundbank name.
     * @return {Boolean} True when removed.
     */
    RemoveAndUnloadDefaultSoundBank(soundBankName)
    {
        return this._EnsureAudio()
            .RemoveAndUnloadDefaultSoundBank(soundBankName);
    }

    /**
     * Loads one soundbank now or retains it for the next enable.
     * @param {String} soundBankName Soundbank name.
     * @return {String} Normalized bank name.
     */
    LoadSoundBank(soundBankName)
    {
        return this._EnsureAudio().LoadSoundBank(soundBankName);
    }

    /**
     * Unloads one non-default soundbank.
     * @param {String} soundBankName Soundbank name.
     * @return {Boolean} True when unloaded or removed from pending loads.
     */
    UnloadSoundBank(soundBankName)
    {
        return this._EnsureAudio().UnloadSoundBank(soundBankName);
    }

    /**
     * Reconciles non-default soundbanks with one desired set.
     * @param {Array<String>} soundBanks Desired soundbank names.
     * @return {Object} Loaded and unloaded bank names.
     */
    SwapSoundBanks(soundBanks)
    {
        return this._EnsureAudio().SwapSoundBanks(soundBanks);
    }

    /**
     * Disables and re-enables while preserving desired soundbanks.
     * @return {Boolean} Whether audio enabled.
     */
    ReloadSoundBanks()
    {
        return this._EnsureAudio().ReloadSoundBanks();
    }

    /**
     * Gets loaded and in-flight soundbank names.
     * @return {Array<String>} Soundbank names.
     */
    GetLoadedSoundBanks()
    {
        return this.audio?.GetLoadedSoundBanks() ?? [];
    }

    /**
     * Sets one global RTPC.
     * @param {String} rtpcName RTPC name.
     * @param {Number} value RTPC value.
     * @return {Boolean} True when applied.
     */
    SetGlobalRTPC(rtpcName, value)
    {
        return this.audio?.SetGlobalRTPC(rtpcName, value) ?? false;
    }

    /**
     * Sets one global authored state.
     * @param {String} stateGroup State group name.
     * @param {String} stateName State name.
     * @return {Boolean} True when applied.
     */
    SetState(stateGroup, stateName)
    {
        return this.audio?.SetState(stateGroup, stateName) ?? false;
    }

    /** Stops emitter-routed and directly posted playback. */
    StopAllPlayingSounds()
    {
        this.audio?.StopAllPlayingSounds();
    }

    /** Suspends the browser audio context. */
    Suspend()
    {
        if (this.state === Tw2AudioMan.State.RUNNING)
        {
            this.context.suspend();
        }
    }

    /** Resumes the browser audio context. */
    Resume()
    {
        if (this.state === Tw2AudioMan.State.SUSPENDED)
        {
            this.context.resume();
        }
    }

    /** Hooks one browser gesture to resume a suspended audio context. */
    ResumeOnGesture()
    {
        if (this._gestureHooked || typeof document === "undefined")
        {
            return;
        }

        this._gestureHooked = true;

        const resume = () =>
        {
            document.removeEventListener("pointerdown", resume);
            document.removeEventListener("keydown", resume);
            this.Resume();
        };

        document.addEventListener("pointerdown", resume);
        document.addEventListener("keydown", resume);
    }

    /** Disposes runtime-audio, emitters, tracking, and the owned context. */
    Dispose()
    {
        this.audio?.Dispose();
        this.audio = null;
        this.listener = null;
        this._emittersByName.clear();
        this._tracked.clear();

        if (this.context)
        {
            this.context.close();
            this.context = null;
        }
    }

    /** Drives listener placement, tracked emitters, and runtime-audio. */
    Tick()
    {
        if (!this.audio)
        {
            return;
        }

        if (this._activeCamera)
        {
            const { mat4_0 } = Tw2AudioMan.global;

            mat4.invert(mat4_0, this._activeCamera.GetView(mat4_0));
            this.SetAudioLocationFromPoseMatrix(mat4_0);
        }
        else if (this.listenerFromCamera
            && tw2.device
            && tw2.device.viewInverse)
        {
            this.SetAudioLocationFromPoseMatrix(tw2.device.viewInverse);
        }

        if (this._dirty && this.listener)
        {
            this.listener.SetPosition(
                this.forward,
                this.up,
                this.position,
            );
            this._dirty = false;
        }

        const {
            mat4_0,
            vec3_0,
            vec3_1,
            vec3_2,
        } = Tw2AudioMan.global;

        for (const [ emitter, follow ] of this._tracked)
        {
            follow.target.GetWorldTransform(mat4_0);
            vec3_0[0] = mat4_0[8];
            vec3_0[1] = mat4_0[9];
            vec3_0[2] = mat4_0[10];
            vec3_1[0] = mat4_0[4];
            vec3_1[1] = mat4_0[5];
            vec3_1[2] = mat4_0[6];
            vec3.transformMat4(
                vec3_2,
                follow.localPosition,
                mat4_0,
            );
            emitter.SetPosition(vec3_0, vec3_1, vec3_2);
        }

        this.audio.Process(
            typeof performance !== "undefined"
                ? performance.now()
                : Date.now(),
        );
    }

    /**
     * Selects the camera used as the listener pose source.
     * @param {?Object} camera Object exposing GetView(out).
     * @return {Tw2AudioMan} This manager.
     */
    SetActiveCamera(camera)
    {
        if (camera && typeof camera.GetView !== "function")
        {
            throw new TypeError(
                "Audio active camera requires GetView(out)",
            );
        }

        this._activeCamera = camera ?? null;
        return this;
    }

    /**
     * Sets the listener pose.
     * @param {vec3} forward Forward vector.
     * @param {vec3} up Up vector.
     * @param {vec3} position Position.
     */
    SetAudioLocation(forward, up, position)
    {
        vec3.copy(this.forward, forward);
        vec3.copy(this.up, up);
        vec3.copy(this.position, position);
        this._dirty = true;
    }

    /**
     * Sets listener pose from a column-vector world pose matrix.
     * @param {mat4} value Pose matrix.
     */
    SetAudioLocationFromPoseMatrix(value)
    {
        this.forward[0] = -value[8];
        this.forward[1] = -value[9];
        this.forward[2] = -value[10];
        this.up[0] = value[4];
        this.up[1] = value[5];
        this.up[2] = value[6];
        this.position[0] = value[12];
        this.position[1] = value[13];
        this.position[2] = value[14];
        this._dirty = true;
    }

    /**
     * Creates and adopts one emitter.
     * @param {Object} [descriptor] Runtime-audio emitter descriptor.
     * @return {Object} Adopted emitter.
     */
    CreateEmitter(descriptor = {})
    {
        const emitter = this._EnsureAudio().CreateEmitter(descriptor);

        if (descriptor.name)
        {
            this._emittersByName.set(descriptor.name, emitter);
        }
        return emitter;
    }

    /**
     * Adopts one existing audio game object.
     * @param {Object} emitter Audio game object.
     * @return {Object} Adopted emitter.
     */
    AdoptEmitter(emitter)
    {
        this._EnsureAudio().AdoptEmitter(emitter);

        const name = emitter.GetName?.() ?? emitter.name;

        if (name)
        {
            this._emittersByName.set(name, emitter);
        }
        return emitter;
    }

    /**
     * Follows a target world transform with one emitter.
     * @param {Object} emitter Audio game object.
     * @param {Object} target Object exposing GetWorldTransform(out).
     * @param {vec3} [localPosition] Target-local emitter position.
     * @return {Object} Emitter.
     */
    TrackEmitter(emitter, target, localPosition)
    {
        if (!target
            || typeof target.GetWorldTransform !== "function")
        {
            throw new TypeError(
                "Audio emitter tracking requires a target with GetWorldTransform",
            );
        }

        this._tracked.set(emitter, {
            target,
            localPosition: localPosition
                ? vec3.fromValues(
                    localPosition[0],
                    localPosition[1],
                    localPosition[2],
                )
                : vec3.create(),
        });
        return emitter;
    }

    /**
     * Stops following a target with one emitter.
     * @param {Object} emitter Audio game object.
     * @return {Boolean} True when tracking existed.
     */
    UntrackEmitter(emitter)
    {
        return this._tracked.delete(emitter);
    }

    /**
     * Stops and releases one emitter.
     * @param {Object} emitter Audio game object.
     * @return {Boolean} True when released.
     */
    ReleaseEmitter(emitter)
    {
        this._tracked.delete(emitter);

        for (const [ name, value ] of this._emittersByName)
        {
            if (value === emitter)
            {
                this._emittersByName.delete(name);
            }
        }

        return this.audio?.ReleaseEmitter(emitter) ?? false;
    }

    /**
     * Finds one emitter by name.
     * @param {String} name Emitter name.
     * @return {?Object} Emitter.
     */
    FindSoundEmitter(name)
    {
        return this._emittersByName.get(name) ?? null;
    }

    /**
     * Gets one emitter by name.
     * @param {String} name Emitter name.
     * @return {?Object} Emitter.
     */
    GetSoundEmitter(name)
    {
        return this.FindSoundEmitter(name);
    }

    _EnsureAudio()
    {
        if (!this.audio)
        {
            const provider = {
                Read: source => this._ReadSource(source),
                ReadRange: (source, options) =>
                    this._ReadSourceRange(source, options),
                CanReadRange: () =>
                    this.allowOffsets && this.rangeSupport,
            };

            this.audio = new CjsAudioMan(null, {
                mediaProvider: provider,
                createContext: () => this._CreateContext(),
                languages: [ this.language ],
                distanceScale: this.distanceScale,
                selectEventMedia: ({ eventName, mediaIDs }) =>
                    mediaIDs[
                        Tw2AudioMan.Hash(eventName) % mediaIDs.length
                    ],
            });
        }
        return this.audio;
    }

    _CreateContext()
    {
        if (this.createContext)
        {
            this.context = this.createContext();
        }
        else if (typeof window !== "undefined")
        {
            const Constructor = window.AudioContext
                ?? window.webkitAudioContext;

            if (Constructor)
            {
                this.context = new Constructor();
            }
        }

        return this.context;
    }

    async _ReadSource(source)
    {
        const url = this._ResolveSourceUrl(source);
        const response = await this._GetFetch()(url);

        if (!response.ok)
        {
            throw new Error(
                `Audio source unavailable (${response.status}): ${url}`,
            );
        }

        return {
            bytes: await response.arrayBuffer(),
            complete: true,
            mediaType: source?.mediaType,
        };
    }

    async _ReadSourceRange(source, {
        offset,
        byteLength,
        signal,
    })
    {
        const url = this._ResolveSourceUrl(source);
        const response = await this._GetFetch()(url, {
            signal,
            headers: {
                Range: `bytes=${offset}-${offset + byteLength - 1}`,
            },
        });

        if (!response.ok && response.status !== 206)
        {
            throw new Error(
                `Audio range fetch failed (${response.status}): ${url}`,
            );
        }

        return {
            bytes: await response.arrayBuffer(),
            complete: response.status !== 206,
        };
    }

    _GetFetch()
    {
        if (this.fetch)
        {
            return this.fetch;
        }
        if (typeof window !== "undefined"
            && typeof window.fetch === "function")
        {
            return window.fetch.bind(window);
        }

        throw new Error("Browser fetch is unavailable");
    }

    _GetProbeSource()
    {
        const embedded = Object.values(
            this.library?.embeddedMedia ?? {},
        ).flat();
        const first = embedded[0];

        if (first)
        {
            return this.library.banks?.[first.bank] ?? null;
        }

        return Object.values(this.library?.media ?? {})
            .flat()
            .find(Boolean) ?? null;
    }

    _ResolveSourceUrl(source)
    {
        const path = this._SourcePath(source);

        return this._ResolveAudioEndpoint(
            `aud:/path/${encodeURIComponent(path.toLowerCase())}`,
        );
    }

    _ResolveAudioEndpoint(path)
    {
        if (!tw2.paths.Has("aud"))
        {
            throw new Error(
                "Audio is unavailable because no tools-core aud: endpoint is configured",
            );
        }
        if (typeof path !== "string" || !path.startsWith("aud:/"))
        {
            throw new TypeError(
                "CCPWGL audio acquisition requires an aud: endpoint path",
            );
        }
        return tw2.paths.Resolve(path);
    }

    _SourcePath(source)
    {
        const path = source?.resPath
            ?? source?.logicalPath
            ?? source?.path;

        if (!path)
        {
            throw new TypeError(
                "Audio source record has no resource path",
            );
        }
        return path;
    }

    /**
     * Gets the audio source capability provider.
     * @return {Object} Capability provider.
     */
    static GetCapabilityProvider()
    {
        return {
            key: "audio.media",
            name: "audio.media",
            category: "audio",
            label: "Audio media sourcing",
            description:
                "Exact individual, whole-file, and original-bank range delivery",
            resolve: ({ tw2 }) =>
                tw2.audMan.DetectMediaSourcing(),
        };
    }

    /**
     * FNV-1a hash used for deterministic multi-media event selection.
     * @param {String} text Input.
     * @return {Number} Unsigned hash.
     */
    static Hash(text)
    {
        let value = 2166136261;

        for (const character of text)
        {
            value ^= character.charCodeAt(0);
            value = Math.imul(value, 16777619);
        }
        return value >>> 0;
    }

    /** Scratch math values. */
    static global = {
        mat4_0: mat4.create(),
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create(),
    };

    /** Browser audio-context states. */
    static State = {
        NO_CONTEXT: "no_context",
        SUSPENDED: "suspended",
        RUNNING: "running",
        CLOSED: "closed",
    };
}
