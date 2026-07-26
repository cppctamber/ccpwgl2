/**
 * Browser-renderer binding for simultaneous masked skeletal viseme clips.
 * This is a ccpwgl adapter, not a Carbon/Trinity class or state-graph evaluator.
 */
export class CcpwglCharacterVisemeBinding
{
    controller;
    profile = null;
    layers = new Map();
    weights = new Map();

    constructor(controller)
    {
        CcpwglCharacterVisemeBinding.validateController(controller);
        this.controller = controller;
    }

    /** Validates the structural interior-animation surface used by this adapter. */
    static validateController(controller)
    {
        if (!controller || typeof controller !== "object")
        {
            throw new TypeError("Character viseme binding requires an animation controller");
        }

        for (const method of [
            "GetAnimation",
            "RegisterMask",
            "RegisterReferenceClip",
            "PlayAdditiveAnimation",
            "SetLayerAmount"
        ])
        {
            if (typeof controller[method] !== "function")
            {
                throw new TypeError(`Character viseme controller requires ${method}()`);
            }
        }

        return controller;
    }

    /** Validates and detaches one renderer-ready viseme profile. */
    static prepareProfile(value)
    {
        if (!value || typeof value !== "object")
        {
            throw new TypeError("Character viseme binding requires a prepared profile");
        }

        const
            id = CcpwglCharacterVisemeBinding.normalizeName(value.id, "profile"),
            maskName = CcpwglCharacterVisemeBinding.normalizeName(value.maskName, "mask"),
            neutralVisemeID = CcpwglCharacterVisemeBinding.normalizeName(
                value.neutralVisemeID,
                "neutral viseme"
            ),
            visemes = Array.isArray(value.visemes) ? value.visemes : null;

        if (!visemes || !visemes.length)
        {
            throw new TypeError(`Character viseme profile "${id}" requires visemes`);
        }
        if (!value.maskWeights || typeof value.maskWeights !== "object")
        {
            throw new TypeError(`Character viseme profile "${id}" requires mask weights`);
        }

        const ids = new Set();
        const preparedVisemes = visemes.map((viseme, index) =>
        {
            const
                visemeID = CcpwglCharacterVisemeBinding.normalizeName(viseme?.id, `viseme ${index}`),
                clipName = CcpwglCharacterVisemeBinding.normalizeName(
                    viseme?.clipName,
                    `viseme ${visemeID} clip`
                ),
                minimum = viseme?.minimum === undefined ? 0 : Number(viseme.minimum),
                maximum = viseme?.maximum === undefined ? 1 : Number(viseme.maximum);

            if (ids.has(visemeID))
            {
                throw new Error(`Character viseme profile "${id}" contains duplicate id "${visemeID}"`);
            }
            if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum > maximum)
            {
                throw new RangeError(`Character viseme "${visemeID}" has an invalid range`);
            }

            ids.add(visemeID);
            return { id: visemeID, clipName, minimum, maximum };
        });

        if (!ids.has(neutralVisemeID))
        {
            throw new Error(`Character viseme profile "${id}" does not contain neutral id "${neutralVisemeID}"`);
        }

        return {
            id,
            maskName,
            maskWeights: value.maskWeights,
            neutralVisemeID,
            visemes: preparedVisemes
        };
    }

    /** Preserves exact authored names while removing outer whitespace. */
    static normalizeName(value, label = "name")
    {
        if (typeof value !== "string" || !value.trim())
        {
            throw new TypeError(`Character viseme ${label} must be a non-empty string`);
        }
        return value.trim();
    }

    /** Produces a private animation layer identity without changing the viseme id. */
    static formatLayerName(profileID, visemeID)
    {
        return `__ccpwgl_viseme__${encodeURIComponent(profileID)}__${encodeURIComponent(visemeID)}`;
    }

    /** Validates one complete desired weight snapshot against a prepared profile. */
    static normalizeWeights(profile, value)
    {
        const entries = value instanceof Map
            ? value.entries()
            : value && typeof value === "object" && !Array.isArray(value)
                ? Object.entries(value)
                : null;

        if (!entries)
        {
            throw new TypeError("Character viseme weights must be a map or object");
        }

        const descriptors = new Map(profile.visemes.map(viseme => [ viseme.id, viseme ]));
        const result = new Map();
        for (const [ rawID, rawWeight ] of entries)
        {
            const id = CcpwglCharacterVisemeBinding.normalizeName(rawID, "id");
            const descriptor = descriptors.get(id);
            const weight = Number(rawWeight);

            if (!descriptor)
            {
                throw new Error(`Character viseme profile "${profile.id}" does not contain "${id}"`);
            }
            if (!Number.isFinite(weight) || weight < descriptor.minimum || weight > descriptor.maximum)
            {
                throw new RangeError(
                    `Character viseme "${id}" weight must be between ${descriptor.minimum} and ${descriptor.maximum}`
                );
            }
            if (result.has(id))
            {
                throw new Error(`Character viseme weights contain duplicate id "${id}"`);
            }
            result.set(id, weight);
        }
        return result;
    }

    /** Binds every clip as an independent zero-weight mouth layer. */
    Bind(value)
    {
        const profile = CcpwglCharacterVisemeBinding.prepareProfile(value);
        const orderedVisemes = [
            ...profile.visemes.filter(viseme => viseme.id !== profile.neutralVisemeID),
            ...profile.visemes.filter(viseme => viseme.id === profile.neutralVisemeID)
        ];

        this.Reset();
        this.layers.clear();
        this.profile = null;
        this.controller.RegisterMask(profile.maskName, profile.maskWeights);

        for (const viseme of orderedVisemes)
        {
            const clip = this.controller.GetAnimation(viseme.clipName);
            if (!clip)
            {
                this.Reset();
                this.layers.clear();
                throw new Error(`Character viseme clip was not found: ${viseme.clipName}`);
            }

            const layerName = CcpwglCharacterVisemeBinding.formatLayerName(profile.id, viseme.id);
            this.controller.RegisterReferenceClip(viseme.clipName, clip);
            const animation = this.controller.PlayAdditiveAnimation({
                Into: "CurrentPose",
                Base: "CurrentPose",
                Delta: viseme.clipName,
                Mask: profile.maskName,
                Amount: 0
            }, {
                cycle: false,
                percent: 1,
                timeScale: 0,
                layerName
            });

            if (!animation)
            {
                this.Reset();
                this.layers.clear();
                throw new Error(`Character viseme clip could not be played: ${viseme.clipName}`);
            }
            if (typeof animation.Pause !== "function")
            {
                this.Reset();
                this.layers.clear();
                throw new TypeError(`Character viseme clip cannot hold a reference pose: ${viseme.clipName}`);
            }

            // A clip started at 100% finishes during the controller's first
            // update before its animation weight can rise above zero. Freeze
            // the sampled end pose so the additive layer remains active while
            // SetWeights drives its independent semantic amount.
            animation.Pause();

            this.controller.SetLayerAmount(layerName, 0);
            this.layers.set(viseme.id, { layerName, clipName: viseme.clipName });
        }

        this.profile = profile;
        this.weights.clear();
        return this.GetSnapshot();
    }

    /** Applies one complete desired viseme snapshot and clears omitted layers. */
    SetWeights(value)
    {
        if (!this.profile)
        {
            throw new Error("Character viseme binding is not prepared");
        }

        const weights = CcpwglCharacterVisemeBinding.normalizeWeights(this.profile, value);
        let changed = false;

        for (const [ id, layer ] of this.layers)
        {
            const next = weights.get(id) ?? 0;
            const previous = this.weights.get(id) ?? 0;
            if (next === previous) continue;
            this.controller.SetLayerAmount(layer.layerName, next);
            changed = true;
        }

        this.weights = weights;
        return changed;
    }

    /** Clears every owned mouth layer without guessing at controller defaults. */
    Reset()
    {
        let changed = false;
        for (const [ id, layer ] of this.layers)
        {
            if ((this.weights.get(id) ?? 0) === 0) continue;
            this.controller.SetLayerAmount(layer.layerName, 0);
            changed = true;
        }
        this.weights.clear();
        return changed;
    }

    /** Returns detached diagnostics for the demo and tests. */
    GetSnapshot()
    {
        return {
            prepared: !!this.profile,
            profileID: this.profile?.id || null,
            maskName: this.profile?.maskName || null,
            neutralVisemeID: this.profile?.neutralVisemeID || null,
            neutralControlMode: "current-pose-cancellation",
            layerCount: this.layers.size,
            weights: Object.fromEntries(this.weights),
            layers: Object.fromEntries([ ...this.layers ].map(([ id, value ]) => [ id, { ...value } ]))
        };
    }
}
