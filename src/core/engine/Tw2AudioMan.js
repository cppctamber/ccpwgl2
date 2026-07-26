import { vec3, mat4 } from "math";
import { assignIfExists } from "utils";
import { CjsAudioSystem, AudListener } from "@carbonenginejs/runtime-audio";
import { CjsWemFormat } from "@carbonenginejs/runtime-resource/formats/wem";

/**
 * Audio manager backed by @carbonenginejs/runtime-audio.
 *
 * Owns the Carbon audio composition root (manager + repository + WebAudio
 * backend), the singleton listener, and a default media pipeline that resolves
 * events through an installed "carbonenginejs.audioLibrary" document: loose
 * wem media fetched by storage path, embedded media sliced out of fetched
 * banks, decoded client-side (Vorbis->Ogg, PTADPCM->PCM).
 *
 * Headless until Enable() is called from a user gesture: constructing the
 * manager or installing a library never creates an AudioContext, and emitters
 * created before enablement queue their events for replay on wake.
 *
 * @property {?CjsAudioSystem} system      - the runtime-audio composition root
 * @property {?AudListener} listener       - the singleton listener, created on Enable
 * @property {?AudioContext} context       - the audio context, created on Enable
 * @property {?Object} library             - installed carbonenginejs.audioLibrary document
 * @property {vec3} forward                - listener forward vector
 * @property {vec3} up                     - listener up vector
 * @property {vec3} position               - listener position
 * @property {String} resourceBaseUrl      - base url storage paths resolve against
 * @property {?Function} mediaUrl          - media id -> url (server-side resolution, e.g. tools-core audio routes)
 * @property {?Function} resolveUrl        - custom library record -> url resolution
 * @property {String} language             - preferred embedded media language
 * @property {Number} distanceScale        - world units to WebAudio panner units
 * @property {?Function} fetch             - fetch override
 * @property {?Function} loadBuffer        - full loadBuffer(eventID, eventName) override
 * @property {?Function} createContext     - AudioContext factory override
 * @property {Map} _emittersByName         - registered emitters by name
 * @property {Map} _tracked                - emitters following a target's world transform
 * @property {Map} _bufferCache            - decoded audio buffers by wem id
 * @property {Map} _bankBytesCache         - fetched bank bytes by bank source id
 * @property {Boolean} _dirty              - listener pose needs pushing
 */
export class Tw2AudioMan
{

    system = null;

    listener = null;

    context = null;

    library = null;

    forward = vec3.fromValues(0, 0, -1);
    up = vec3.fromValues(0, 1, 0);
    position = vec3.create();

    resourceBaseUrl = "https://resources.eveonline.com/";
    mediaUrl = null;
    resolveUrl = null;
    language = "en-us";
    distanceScale = 1;
    fetch = null;
    loadBuffer = null;
    createContext = null;

    _emittersByName = new Map();
    _tracked = new Map();
    _bufferCache = new Map();
    _bankBytesCache = new Map();
    _dirty = true;

    /**
     * Gets whether the underlying engine is enabled
     * @return {Boolean}
     */
    get enabled()
    {
        return !!this.system?.manager?.enabled;
    }

    /**
     * Gets the audio context state
     * @return {String}
     */
    get state()
    {
        return this.context ? this.context.state : Tw2AudioMan.State.NO_CONTEXT;
    }

    /**
     * Registers options
     * @param {Object} opt
     */
    Register(opt)
    {
        if (!opt) return;

        assignIfExists(this, opt, [
            "resourceBaseUrl",
            "mediaUrl",
            "resolveUrl",
            "language",
            "distanceScale",
            "fetch",
            "loadBuffer",
            "createContext"
        ]);

        if (opt.library) this.SetLibrary(opt.library);
    }

    /**
     * Installs an audio library document
     * @param {Object} library - a carbonenginejs.audioLibrary v1/v2 document
     * @return {Tw2AudioMan}
     */
    SetLibrary(library)
    {
        if (!library || library.schema !== Tw2AudioMan.LIBRARY_SCHEMA)
        {
            throw new TypeError(`Audio manager requires a "${Tw2AudioMan.LIBRARY_SCHEMA}" document`);
        }
        this.library = library;
        this._bufferCache.clear();
        this._bankBytesCache.clear();
        if (this.system && library.metadata)
        {
            this.system.repository.Initialize(library.metadata);
        }
        return this;
    }

    /**
     * Creates the audio context and enables the engine.
     * Must be called from a user gesture for audible output.
     * @param {Object} [opt]
     * @param {Array<String>} [opt.soundBanks] - banks to load, defaults to every library bank
     * @return {Boolean} whether the engine enabled
     */
    Enable({ soundBanks } = {})
    {
        const system = this._EnsureSystem();
        const banks = soundBanks || Object.keys(this.library?.metadata?.SoundBanks || {});
        const enabled = system.Enable(banks);

        if (!this.context && system.backend) this.context = system.backend.context;
        this.Resume();

        if (!this.listener)
        {
            this.listener = new AudListener();
            system.AdoptEmitter(this.listener);
            this._dirty = true;
        }
        return enabled;
    }

    /**
     * Disables the engine, keeping the graph and context
     */
    Disable()
    {
        this.system?.Disable();
    }

    /**
     * Suspends the audio context
     */
    Suspend()
    {
        if (this.state === Tw2AudioMan.State.RUNNING) this.context.suspend();
    }

    /**
     * Resumes the audio context
     */
    Resume()
    {
        if (this.state === Tw2AudioMan.State.SUSPENDED) this.context.resume();
    }

    /**
     * Disposes the engine, emitters and context
     */
    Dispose()
    {
        this.system?.Dispose();
        this.system = null;
        this.listener = null;
        this._emittersByName.clear();
        this._tracked.clear();
        this._bufferCache.clear();
        this._bankBytesCache.clear();
        if (this.context)
        {
            this.context.close();
            this.context = null;
        }
    }

    /**
     * Per frame update
     */
    Tick()
    {
        if (!this.system) return;
        if (this._dirty && this.listener)
        {
            this.listener.SetPosition(this.forward, this.up, this.position);
            this._dirty = false;
        }

        const { mat4_0, vec3_0, vec3_1, vec3_2 } = Tw2AudioMan.global;
        for (const [ emitter, follow ] of this._tracked)
        {
            follow.target.GetWorldTransform(mat4_0);
            vec3_0[0] = mat4_0[8];
            vec3_0[1] = mat4_0[9];
            vec3_0[2] = mat4_0[10];
            vec3_1[0] = mat4_0[4];
            vec3_1[1] = mat4_0[5];
            vec3_1[2] = mat4_0[6];
            vec3.transformMat4(vec3_2, follow.localPosition, mat4_0);
            emitter.SetPosition(vec3_0, vec3_1, vec3_2);
        }

        this.system.Process(typeof performance !== "undefined" ? performance.now() : Date.now());
    }

    /**
     * Sets the listener location
     * @param {vec3} forward
     * @param {vec3} up
     * @param {vec3} position
     */
    SetAudioLocation(forward, up, position)
    {
        vec3.copy(this.forward, forward);
        vec3.copy(this.up, up);
        vec3.copy(this.position, position);
        this._dirty = true;
    }

    /**
     * Sets the listener location from a pose matrix
     * @param {mat4} m
     */
    SetAudioLocationFromPoseMatrix(m)
    {
        this.forward[0] = -m[8];
        this.forward[1] = -m[9];
        this.forward[2] = -m[10];
        this.up[0] = m[4];
        this.up[1] = m[5];
        this.up[2] = m[6];
        this.position[0] = m[12];
        this.position[1] = m[13];
        this.position[2] = m[14];
        this._dirty = true;
    }

    /**
     * Creates and adopts an emitter
     * @param {Object} [descriptor] - name, eventPrefix/prefix, position, attenuationScalingFactor...
     * @return {AudEmitter}
     */
    CreateEmitter(descriptor = {})
    {
        const emitter = this._EnsureSystem().CreateEmitter(descriptor);
        if (descriptor.name) this._emittersByName.set(descriptor.name, emitter);
        return emitter;
    }

    /**
     * Adopts an externally constructed audio game object
     * @param {AudGameObjResource} emitter
     * @return {AudGameObjResource}
     */
    AdoptEmitter(emitter)
    {
        this._EnsureSystem().AdoptEmitter(emitter);
        const name = emitter.GetName?.() || emitter.name;
        if (name) this._emittersByName.set(name, emitter);
        return emitter;
    }

    /**
     * Follows a target's world transform with an emitter each tick
     * @param {AudGameObjResource} emitter
     * @param {*} target                - object exposing GetWorldTransform(out)
     * @param {vec3} [localPosition]    - target-local emitter position
     * @return {AudGameObjResource}
     */
    TrackEmitter(emitter, target, localPosition)
    {
        if (!target || typeof target.GetWorldTransform !== "function")
        {
            throw new TypeError("Audio emitter tracking requires a target with GetWorldTransform");
        }
        this._tracked.set(emitter, {
            target,
            localPosition: localPosition ? vec3.fromValues(localPosition[0], localPosition[1], localPosition[2]) : vec3.create()
        });
        return emitter;
    }

    /**
     * Stops following a target with an emitter
     * @param {AudGameObjResource} emitter
     * @return {Boolean}
     */
    UntrackEmitter(emitter)
    {
        return this._tracked.delete(emitter);
    }

    /**
     * Stops and unregisters an adopted emitter
     * @param {AudGameObjResource} emitter
     * @return {Boolean}
     */
    ReleaseEmitter(emitter)
    {
        this._tracked.delete(emitter);
        for (const [ name, value ] of this._emittersByName)
        {
            if (value === emitter) this._emittersByName.delete(name);
        }
        return this.system ? this.system.ReleaseEmitter(emitter) : false;
    }

    /**
     * Finds a registered sound emitter by name
     * @param {String} name
     * @return {?AudGameObjResource}
     */
    FindSoundEmitter(name)
    {
        return this._emittersByName.get(name) || null;
    }

    /**
     * Finds a registered sound emitter by name
     * @param {String} name
     * @return {?AudGameObjResource}
     */
    GetSoundEmitter(name)
    {
        return this.FindSoundEmitter(name);
    }

    /**
     * Resolves and decodes the media for an event
     * @param {Number} eventID
     * @param {String} eventName
     * @return {Promise<?AudioBuffer>}
     */
    async LoadEventBuffer(eventID, eventName)
    {
        if (this.loadBuffer)
        {
            return this.loadBuffer(eventID, eventName);
        }

        const wemId = this.ResolveEventMedia(eventName);
        if (!wemId) return null;
        if (this._bufferCache.has(wemId)) return this._bufferCache.get(wemId);

        const bytes = await this.FetchWemBytes(wemId);
        const buffer = await this.DecodeWem(bytes);
        this._bufferCache.set(wemId, buffer);
        return buffer;
    }

    /**
     * Picks the media for an event from the library's exact HIRC edges.
     * No edges means a control or unshipped event and resolves to silence,
     * matching the real client.
     * @param {String} eventName
     * @return {?String} wem id
     */
    ResolveEventMedia(eventName)
    {
        const candidates = (this.library?.eventMedia?.[eventName] || [])
            .filter(id => this.library.media?.[id] || this.library.embeddedMedia?.[id]);

        if (!candidates.length) return null;
        return candidates[Tw2AudioMan.Hash(eventName) % candidates.length];
    }

    /**
     * Fetches the bytes for a wem id, from loose media or a bank slice
     * @param {String} wemId
     * @return {Promise<Uint8Array>}
     */
    async FetchWemBytes(wemId)
    {
        // A media-id endpoint (e.g. tools-core /eve/<build>/audio/id/<id>)
        // resolves loose, embedded and localized sources server-side.
        if (this.mediaUrl)
        {
            return this._FetchBytes(this.mediaUrl(wemId, this.library));
        }

        const loose = this.library?.media?.[wemId];
        if (loose)
        {
            return this._FetchBytes(this._ResolveMediaUrl(loose));
        }

        const variant = this._PickEmbeddedVariant(this.library?.embeddedMedia?.[wemId]);
        if (!variant)
        {
            throw new ReferenceError(`Audio media not found in library: ${wemId}`);
        }

        const bank = this.library.banks?.[variant.bank];
        if (!bank)
        {
            throw new ReferenceError(`Audio bank not found in library: ${variant.bank}`);
        }

        const bankBytes = await this._FetchBankBytes(bank);
        return bankBytes.subarray(variant.offset, variant.offset + variant.byteLength);
    }

    /**
     * Decodes wem bytes into an audio buffer
     * @param {Uint8Array} bytes
     * @return {Promise<AudioBuffer>}
     */
    async DecodeWem(bytes)
    {
        if (!this.context) throw new ReferenceError("Audio manager has no context, call Enable first");

        try
        {
            const ogg = CjsWemFormat.toOgg(bytes);
            return await this.context.decodeAudioData(ogg.bytes.slice().buffer);
        }
        catch (err)
        {
            const pcm = CjsWemFormat.toPcm(bytes);
            const buffer = this.context.createBuffer(pcm.channels, pcm.sampleCount, pcm.sampleRate);
            pcm.channelData.forEach((data, channel) => buffer.copyToChannel(data, channel));
            return buffer;
        }
    }

    /**
     * Creates the composition root and wires the graph seams
     * @return {CjsAudioSystem}
     */
    _EnsureSystem()
    {
        if (!this.system)
        {
            this.system = new CjsAudioSystem({
                createContext: () => this._CreateContext(),
                loadBuffer: (eventID, eventName) => this.LoadEventBuffer(eventID, eventName),
                audioMetadata: this.library?.metadata,
                distanceScale: this.distanceScale
            }).Attach();
        }
        return this.system;
    }

    /**
     * Creates the audio context
     * @return {?AudioContext}
     */
    _CreateContext()
    {
        if (this.createContext)
        {
            this.context = this.createContext();
        }
        else if (typeof window !== "undefined")
        {
            const Context = window.AudioContext || window.webkitAudioContext;
            if (Context) this.context = new Context();
        }
        return this.context;
    }

    /**
     * Picks the embedded media variant for the preferred language.
     * Library records hold a single object for one variant and an array
     * for per-language variants.
     * @param {Array<Object>|Object} record
     * @return {?Object}
     */
    _PickEmbeddedVariant(record)
    {
        const variants = Array.isArray(record) ? record : record ? [ record ] : [];
        if (!variants.length) return null;
        return variants.find(v => v.language === this.language)
            || variants.find(v => v.language === "")
            || variants[0];
    }

    /**
     * Fetches and caches a bank's bytes
     * @param {Object} bank - a library bank record
     * @return {Promise<Uint8Array>}
     */
    _FetchBankBytes(bank)
    {
        if (!this._bankBytesCache.has(bank.sourceID))
        {
            this._bankBytesCache.set(
                bank.sourceID,
                this._FetchBytes(this._ResolveMediaUrl(bank))
            );
        }
        return this._bankBytesCache.get(bank.sourceID);
    }

    /**
     * Resolves a library media/bank record to a url.
     * Defaults to the storage path against resourceBaseUrl; hosts can
     * override with resolveUrl(record) e.g. to serve by res path.
     * @param {Object} record
     * @return {String}
     */
    _ResolveMediaUrl(record)
    {
        if (this.resolveUrl)
        {
            const resolved = this.resolveUrl(record);
            if (resolved) return resolved;
        }
        return this.resourceBaseUrl + record.storagePath;
    }

    /**
     * Fetches a url as bytes
     * @param {String} url
     * @return {Promise<Uint8Array>}
     */
    async _FetchBytes(url)
    {
        const doFetch = this.fetch || fetch;
        const response = await doFetch(url);
        if (!response.ok)
        {
            throw new Error(`Audio media fetch failed (${response.status}): ${url}`);
        }
        return new Uint8Array(await response.arrayBuffer());
    }

    /**
     * FNV-1a hash, the deterministic edge choice for multi-media events
     * @param {String} text
     * @return {Number}
     */
    static Hash(text)
    {
        let h = 2166136261;
        for (const c of text)
        {
            h ^= c.charCodeAt(0);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    /**
     * Scratch variables
     * @type {Object}
     */
    static global = {
        mat4_0: mat4.create(),
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create()
    };

    /**
     * The library document schema this manager installs
     * @type {String}
     */
    static LIBRARY_SCHEMA = "carbonenginejs.audioLibrary";

    /**
     * Context states
     * @type {Object}
     */
    static State = {
        NO_CONTEXT: "no_context",
        SUSPENDED: "suspended",
        RUNNING: "running",
        CLOSED: "closed"
    };

}
