const CINEMATIC_REVEAL_PATH = "res:/fisfx/ship/boarding/evemultieffect_playershipboarding_01a.black";


export class TnySceneCinematicReveal
{

    scene = null;
    target = null;
    effect = null;
    resPath = CINEMATIC_REVEAL_PATH;
    _bindings = null;
    _bindingMode = "all";
    _boundingSphere = new Float32Array(4);
    _boosterCenter = new Float32Array(3);
    _boosterLocatorCount = 0;
    _playback = null;
    _cameraControl = null;

    constructor(scene, target, effect, options = {})
    {
        this.scene = scene || null;
        this.effect = effect || null;
        this.resPath = options.resPath || CINEMATIC_REVEAL_PATH;
        this.SetTarget(target);

        const wrapped = this.effect && this.effect.wrapped;
        this._bindings = wrapped && wrapped.bindings ? wrapped.bindings.slice() : [];
        this.RefreshTargetMetrics();
    }

    get wrapped()
    {
        return this.effect && this.effect.wrapped || null;
    }

    SetTarget(target)
    {
        this.target = target || null;
        if (this.effect && target)
        {
            this.effect.SetParameter("playerShip", this.GetWrappedTarget());
        }
        this.RefreshTargetMetrics();
        return this;
    }

    Retarget(target)
    {
        this.Stop();
        this.SetTarget(target);
        this.ResetBoosters();
        return this;
    }

    GetWrappedTarget()
    {
        return this.target && this.target.wrapped || this.target || null;
    }

    SetBindingMode(mode = "all")
    {
        const wrapped = this.wrapped;
        if (!wrapped || !wrapped.bindings || !this._bindings) return this;

        const bindings = mode === "boosters"
            ? this._bindings.filter(TnySceneCinematicReveal.IsBoosterBinding)
            : mode === "lights"
                ? this._bindings.filter(x => !TnySceneCinematicReveal.IsBoosterBinding(x))
                : this._bindings;

        wrapped.bindings.splice(0, wrapped.bindings.length, ...bindings);
        this._bindingMode = mode;
        this.effect.Rebind && this.effect.Rebind();
        return this;
    }

    Start(mode = "all")
    {
        if (!this.effect) return this;
        this.SetBindingMode(mode);
        this.effect.SetControllerVariable("board", 0);
        this.effect.SetControllerVariable("_onShipFX", 0);
        this.effect.StopControllers();
        this.effect.StartControllers();
        this.effect.SetControllerVariable("board", 1);
        return this;
    }

    StartLights()
    {
        return this.Start("lights");
    }

    StartBoosters()
    {
        this.ResetBoosters();
        return this.Start("boosters");
    }

    async Play(mode = "all", options = {})
    {
        if (typeof options === "number") options = { duration: options };
        const { duration = 0, stop = false } = options;

        this.Start(mode);
        await this.Wait(duration);
        if (stop) this.Stop();
        return this;
    }

    PlayLights(options)
    {
        return this.Play("lights", options);
    }

    PlayBoosters(options)
    {
        return this.Play("boosters", options);
    }

    TakeCameraControl(client, camera)
    {
        if (!client || typeof client.GetCamera !== "function" || typeof client.SetCamera !== "function")
        {
            throw new TypeError("Cinematic reveal camera control requires a runtime client");
        }

        if (this._cameraControl && this._cameraControl.client !== client)
        {
            this.ReleaseCameraControl();
        }

        const previous = this._cameraControl && this._cameraControl.client === client
            ? this._cameraControl.previous
            : client.GetCamera();
        const active = camera || this._cameraControl && this._cameraControl.camera || null;
        this._cameraControl = { client, previous, camera: active };

        if (active)
        {
            client.SetCamera(active);
        }

        return active || this;
    }

    ReleaseCameraControl()
    {
        const control = this._cameraControl;
        this._cameraControl = null;

        if (control && control.client && typeof control.client.SetCamera === "function")
        {
            control.client.SetCamera(control.previous || null);
        }

        return this;
    }

    GetControlledCamera()
    {
        return this._cameraControl && this._cameraControl.camera || null;
    }

    async PlaySequence(steps = [])
    {
        for (let i = 0; i < steps.length; i++)
        {
            const step = steps[i];
            if (!step) continue;

            if (typeof step === "string")
            {
                await this.Play(step);
            }
            else if (typeof step === "number")
            {
                await this.Wait(step);
            }
            else if (step.wait !== undefined)
            {
                await this.Wait(step.wait);
            }
            else
            {
                await this.Play(step.mode || "all", step);
            }
        }
        return this;
    }

    Wait(duration = 0)
    {
        this._ClearPlayback();
        return new Promise(resolve =>
        {
            const playback = this._playback = {
                resolve: () =>
                {
                    if (this._playback === playback)
                    {
                        this._playback = null;
                    }
                    resolve(this);
                },
                timer: null
            };

            const ms = Math.max(0, Number(duration) || 0) * 1000;
            playback.timer = setTimeout(playback.resolve, ms);
        });
    }

    Stop()
    {
        this._ClearPlayback();
        if (this.effect)
        {
            this.effect.SetControllerVariable("board", 0);
            this.effect.SetControllerVariable("_onShipFX", 0);
            this.effect.StopControllers();
        }
        this.ResetBoosters();
        return this;
    }

    _ClearPlayback()
    {
        if (this._playback)
        {
            clearTimeout(this._playback.timer);
            const { resolve } = this._playback;
            this._playback = null;
            resolve();
        }
    }

    Dispose()
    {
        this.ReleaseCameraControl();
        this.Stop();
        if (this.scene && this.effect)
        {
            this.scene.RemoveObject(this.effect);
        }
        if (this.scene && this.scene._cinematicReveal === this)
        {
            this.scene._cinematicReveal = null;
        }
        this.scene = null;
        this.target = null;
        this.effect = null;
        return true;
    }

    ResetBoosters()
    {
        const target = this.GetWrappedTarget();
        if (!target) return this;

        if ("boosterGain" in target) target.boosterGain = 0;
        if (target.boosters)
        {
            target.boosters.alwaysOn = false;
            target.boosters.alwaysOnIntensity = 0;
        }
        return this;
    }

    RefreshTargetMetrics()
    {
        this._boundingSphere[0] = 0;
        this._boundingSphere[1] = 0;
        this._boundingSphere[2] = 0;
        this._boundingSphere[3] = 0;

        const sphere = this.GetBoundingSphere(this._boundingSphere);
        if (!sphere || sphere !== this._boundingSphere)
        {
            this._boundingSphere[0] = sphere && sphere[0] || 0;
            this._boundingSphere[1] = sphere && sphere[1] || 0;
            this._boundingSphere[2] = sphere && sphere[2] || 0;
            this._boundingSphere[3] = sphere && sphere[3] || 0;
        }

        this._boosterLocatorCount = 0;
        this._boosterCenter[0] = 0;
        this._boosterCenter[1] = 0;
        this._boosterCenter[2] = 0;
        this.GetBoosterCenter(this._boosterCenter);
        return this;
    }

    GetBoosterState()
    {
        const target = this.GetWrappedTarget();
        const boosters = target && target.boosters;
        const renderable = boosters && boosters.GetRenderable ? boosters.GetRenderable() : null;
        return {
            activationStrength: target && target.activationStrength || 0,
            alwaysOn: boosters && boosters.alwaysOn || false,
            alwaysOnIntensity: boosters && boosters.alwaysOnIntensity || 0,
            boosterGain: target && target.boosterGain || 0,
            renderIntensity: renderable && renderable.overallIntensity || 0
        };
    }

    GetBoundingSphere(out)
    {
        const target = this.GetWrappedTarget();
        return target && target.GetBoundingSphere ? target.GetBoundingSphere(out) : null;
    }

    GetCachedBoundingSphere(out)
    {
        out[0] = this._boundingSphere[0];
        out[1] = this._boundingSphere[1];
        out[2] = this._boundingSphere[2];
        out[3] = this._boundingSphere[3];
        return out;
    }

    GetCachedBoosterCenter(out)
    {
        out[0] = this._boosterCenter[0];
        out[1] = this._boosterCenter[1];
        out[2] = this._boosterCenter[2];
        return this._boosterLocatorCount ? out : null;
    }

    GetBoosterLocatorCount()
    {
        return this._boosterLocatorCount;
    }

    GetBoosterCenter(out, world = false)
    {
        const target = this.GetWrappedTarget();
        if (!target || !target.FindLocatorsByPrefix || !target.ResolveLocatorTransforms) return null;

        const locators = target.FindLocatorsByPrefix("locator_booster");
        const matrices = [], pool = [];
        target.ResolveLocatorTransforms(locators, matrices, pool);

        let count = 0;
        out[0] = out[1] = out[2] = 0;
        for (let i = 0; i < matrices.length; i++)
        {
            const matrix = matrices[i];
            if (!matrix) continue;
            out[0] += matrix[12];
            out[1] += matrix[13];
            out[2] += matrix[14];
            count++;
        }

        this._boosterLocatorCount = count;
        if (!count) return null;
        out[0] /= count;
        out[1] /= count;
        out[2] /= count;

        if (world && target.GetWorldTransform)
        {
            const m = TnySceneCinematicReveal.global.world;
            target.GetWorldTransform(m);
            const x = out[0], y = out[1], z = out[2];
            out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
            out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
            out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
        }

        return out;
    }

    static async Create(scene, target, options = {})
    {
        if (!scene || !scene.FetchMultiEffect) throw new TypeError("Invalid scene");
        if (!target) throw new TypeError("Invalid cinematic reveal target");

        const resPath = options.resPath || CINEMATIC_REVEAL_PATH;
        const effect = await scene.FetchMultiEffect({
            resPath,
            parameters: { playerShip: target },
            controllerVariables: { board: 0, _onShipFX: 0 },
            autoStart: false
        }, options.onProgress, true);

        scene.AddObject(effect);
        const reveal = new this(scene, target, effect, { ...options, resPath });
        reveal.ResetBoosters();
        return reveal;
    }

    static IsBoosterBinding(binding)
    {
        return /^ShipBoosters?_/.test(binding && binding.name || "");
    }

    static global = {
        world: new Float32Array(16)
    };

}
