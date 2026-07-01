import { device, tw2 } from "global";
import { vec3, vec4, mat4 } from "math";
import { Tw2BatchAccumulator, Tw2Effect, Tw2Frustum, Tw2PerObjectData, Tw2RawData, Tw2RenderTarget } from "core";
import { CMP_GREATEREQUAL, RM_OPAQUE, RS_ALPHAFUNC, RS_ALPHAREF, RS_ALPHATESTENABLE } from "constant";


const DEFAULT_SHADOW_EFFECT_PATH = "cdn:/graphics/effect.gles2/managed/space/spaceobject/shadow/shadow.sm_hi";
const DEFAULT_SKINNED_SHADOW_EFFECT_PATH = "cdn:/graphics/effect.gles2/managed/space/spaceobject/shadow/skinned_shadow.sm_hi";


export class EveSpaceSceneShadowHandler
{

    scene = null;
    enabled = true;
    collectBatches = true;
    debug = false;
    debugWidth = 192;
    debugHeight = 120;

    shadowEffect = null;
    shadowEffectPath = DEFAULT_SHADOW_EFFECT_PATH;
    skinnedShadowEffect = null;
    skinnedShadowEffectPath = DEFAULT_SKINNED_SHADOW_EFFECT_PATH;

    atlasSize = 1024;
    mapOffsetX = 0;
    mapOffsetY = 0;
    depthBias = 0;
    cameraNear = 1;
    cameraFar = 2;
    minimumVisibility = 0;
    fitCameraFrustum = false;
    frustumNear = 1;
    frustumFar = 1200;
    autoSettings = false;

    _accumulator = null;
    _renderTarget = null;
    _mapRes = null;
    _frustum = new Tw2Frustum();
    _view = mat4.create();
    _projection = mat4.create();
    _viewProjection = mat4.create();
    _perFrameVS = Tw2RawData.from(EveSpaceSceneShadowHandler.perFrameData.vs);
    _perFramePS = Tw2RawData.from(EveSpaceSceneShadowHandler.perFrameData.ps);
    _frustumCorners = [
        vec3.create(), vec3.create(), vec3.create(), vec3.create(),
        vec3.create(), vec3.create(), vec3.create(), vec3.create()
    ];

    _report = {
        ok: false,
        status: "not_run",
        rendered: 0,
        collected: 0,
        technique: "Main",
        casters: 0
    };

    constructor(scene = null)
    {
        this.scene = scene;
    }

    /**
     * Applies receiver and shadow pass frame data.
     * @param {EveSpaceScene} [scene]
     */
    ApplyPerFrameData(scene = this.scene)
    {
        this.scene = scene || this.scene;
        if (!this.ShouldRender(scene))
        {
            EveSpaceSceneShadowHandler.ApplyDisabledFrameData(scene);
            return false;
        }

        device.perFrameShadowPSData = this._perFramePS;
        device.perFrameShadowVSData = this._perFrameVS;

        this.UpdateMatrices(scene);

        const
            g = EveSpaceSceneShadowHandler.global,
            shadowViewTranspose = mat4.transpose(g.mat4_0, this._view),
            shadowViewProjectionTranspose = mat4.transpose(g.mat4_1, this._viewProjection);

        scene._perFrameVS.Set("ShadowViewMat", shadowViewTranspose);
        scene._perFrameVS.Set("ShadowViewProjectionMat", shadowViewProjectionTranspose);

        this._perFrameVS.Set("ShadowView", shadowViewTranspose);
        this._perFrameVS.Set("ShadowViewProjection", shadowViewProjectionTranspose);
        this._perFrameVS.Set("ShadowNearFar", [ this.cameraNear, this.cameraFar || 1, 0, 0 ]);

        const shadowsEnabled = scene.enableShadows && scene.visible.shadow;
        const shadowMapSettings = [
            this.mapOffsetX,
            this.mapOffsetY,
            this.depthBias,
            scene.shadowFadeThreshold || 0
        ];
        const shadowCameraRange = [
            shadowsEnabled ? this.cameraNear : 1,
            shadowsEnabled ? this.cameraFar : 1,
            this.minimumVisibility,
            0
        ];

        if (this.autoSettings)
        {
            shadowMapSettings[0] = 0;
            shadowMapSettings[1] = 0;
            shadowMapSettings[2] = 0;
            shadowMapSettings[3] = 0;
            shadowCameraRange[0] = shadowsEnabled ? 0 : 1;
            shadowCameraRange[1] = shadowsEnabled ? this.cameraFar : 1;
            shadowCameraRange[2] = this.minimumVisibility;
        }

        scene._perFramePS.Set("ShadowMapSettings", shadowMapSettings);
        scene._perFramePS.Set("ShadowCameraRange", shadowCameraRange);
        EveSpaceSceneShadowHandler.EnsureFallbackVariables();
        return true;
    }

    /**
     * Renders the scene shadow atlas.
     * @param {Number} dt
     * @param {EveSpaceScene} [scene]
     * @returns {Object}
     */
    RenderShadowPass(dt, scene = this.scene)
    {
        this.scene = scene || this.scene;

        const report = this._report;
        report.ok = false;
        report.collected = 0;
        report.rendered = 0;
        report.casters = 0;
        report.technique = "Main";
        report.status = "disabled";

        if (!this.ShouldRender(scene))
        {
            EveSpaceSceneShadowHandler.ApplyDisabledFrameData(scene);
            return report;
        }

        this.ApplyPerFrameData(scene);
        EveSpaceSceneShadowHandler.EnsureFallbackVariables();

        const shadowTarget = this.EnsureRenderTarget();
        if (!shadowTarget)
        {
            report.status = "missing_shadow_target";
            return report;
        }

        const accumulator = this._accumulator || (this._accumulator = new Tw2BatchAccumulator());
        accumulator.Clear();

        const shadowEffect = this.EnsureEffect(false);
        const skinnedShadowEffect = this.EnsureEffect(true);
        const collected = this.GetBatches(RM_OPAQUE, accumulator, {
            dt,
            includeObjects: true,
            includeBackgroundObjects: true,
            shadowEffect,
            skinnedShadowEffect
        });

        report.collected = accumulator.length;

        if (!collected || !report.collected)
        {
            report.status = "no_shadow_batches";
            EveSpaceSceneShadowHandler.ResetFallbackVariables();
            return report;
        }

        let rendered = 0;
        shadowTarget.SetCallUnset(() =>
        {
            const clearColor = tw2.GetClearColor(vec4.copy(EveSpaceSceneShadowHandler.global.vec4_0, [ 0, 0, 0, 1 ]));
            try
            {
                tw2.SetClearColor([ 1, 1, 0, 1 ]);
                tw2.ClearBufferBits(true, true, true);
                rendered = this.RenderBatches(shadowTarget, accumulator, {
                    preferredTechnique: "Main",
                    fallbackEffect: shadowEffect
                });
            }
            finally
            {
                tw2.SetClearColor(clearColor);
            }
        });

        report.rendered = rendered;
        report.ok = report.rendered > 0;
        report.status = report.ok ? "rendered" : "render_failed";
        this.AttachVariables();

        return report;
    }

    /**
     * Renders a bottom-left shadow atlas debug preview.
     * @returns {Boolean}
     */
    RenderDebug()
    {
        if (!this.debug || !this._renderTarget || !this._renderTarget.texture)
        {
            return false;
        }

        const gl = tw2.gl;
        const viewport = gl.getParameter(gl.VIEWPORT) || [ 0, 0, tw2.width, tw2.height ];
        const depthTest = gl.isEnabled(gl.DEPTH_TEST);
        const scissorTest = gl.isEnabled(gl.SCISSOR_TEST);
        const cullFace = gl.isEnabled(gl.CULL_FACE);
        const depthMask = gl.getParameter(gl.DEPTH_WRITEMASK);

        gl.disable(gl.SCISSOR_TEST);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.depthMask(false);
        gl.viewport(0, 0, this.debugWidth || 192, this.debugHeight || 120);

        tw2.device.RenderTexture(this._renderTarget.texture);

        if (depthTest) gl.enable(gl.DEPTH_TEST);
        else gl.disable(gl.DEPTH_TEST);

        if (scissorTest) gl.enable(gl.SCISSOR_TEST);
        else gl.disable(gl.SCISSOR_TEST);

        if (cullFace) gl.enable(gl.CULL_FACE);
        else gl.disable(gl.CULL_FACE);

        gl.depthMask(depthMask);
        gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
        this.DirtyDeviceState();
        return true;
    }

    ShouldRender(scene = this.scene)
    {
        return !!scene && !!this.enabled && !!scene.enableShadows && !!scene.visible.shadow && !!this.collectBatches;
    }

    GetReport()
    {
        return this._report;
    }

    SetDebugging(enabled = true, width, height)
    {
        this.debug = !!enabled;
        if (Number.isFinite(width)) this.debugWidth = Math.max(1, Math.floor(width));
        if (Number.isFinite(height)) this.debugHeight = Math.max(1, Math.floor(height));
        return this.GetReport();
    }

    SetBatchCollection(enabled = true)
    {
        this.collectBatches = !!enabled;
        return this.collectBatches;
    }

    EnsureRenderTarget()
    {
        if (!this._renderTarget)
        {
            this._renderTarget = new Tw2RenderTarget(
                "EveSpaceSceneShadowMapCascaded",
                this.atlasSize,
                this.atlasSize,
                true
            );
        }
        else
        {
            this._renderTarget.Update(this.atlasSize, this.atlasSize, true);
        }

        return this._renderTarget.IsGood() ? this._renderTarget : null;
    }

    AttachVariables()
    {
        if (!this._renderTarget?.texture)
        {
            return false;
        }

        let attached = false;
        const names = [ "EveSpaceSceneShadowMap", "EveSpaceSceneCascadedShadowMap" ];
        for (let i = 0; i < names.length; i++)
        {
            if (!tw2.HasVariable(names[i]))
            {
                continue;
            }

            const variable = tw2.GetVariable(names[i]);
            if (variable && typeof variable.AttachTextureRes === "function")
            {
                variable.AttachTextureRes(this._renderTarget.texture);
                attached = true;
            }
        }

        this._mapRes = this._renderTarget.texture;
        return attached;
    }

    EnsureEffect(skinned = false)
    {
        const property = skinned ? "skinnedShadowEffect" : "shadowEffect";
        const pathProperty = skinned ? "skinnedShadowEffectPath" : "shadowEffectPath";

        if (this[property])
        {
            if (!this[property].IsGood() && typeof this[property].Initialize === "function")
            {
                try
                {
                    this[property].Initialize();
                }
                catch
                {
                    this[property] = null;
                    return null;
                }
            }

            return this[property].IsGood() ? this[property] : null;
        }

        if (!this[pathProperty])
        {
            return null;
        }

        const effect = new Tw2Effect();
        effect.name = skinned ? "EveSpaceSceneSkinnedShadow" : "EveSpaceSceneShadow";
        effect.effectFilePath = this[pathProperty];
        effect.autoParameter = true;

        try
        {
            effect.Initialize();
        }
        catch
        {
            return null;
        }

        if (!effect.IsGood())
        {
            return null;
        }

        this[property] = effect;
        return effect;
    }

    IsCasterSkinned(candidate)
    {
        if (!candidate)
        {
            return false;
        }

        if (typeof candidate.isSkinned === "function")
        {
            return !!candidate.isSkinned();
        }

        if (candidate.isSkinned)
        {
            return true;
        }

        if (candidate.animation && candidate.animation.animations && candidate.animation.animations.length)
        {
            return true;
        }

        const jointMat = candidate._perObjectData
            && candidate._perObjectData.vs
            && typeof candidate._perObjectData.vs.Get === "function"
            && EveSpaceSceneShadowHandler.SafeGetRawData(candidate._perObjectData.vs, "JointMat");

        if (!jointMat)
        {
            return false;
        }

        for (let i = 0; i < jointMat.length; i++)
        {
            if (jointMat[i])
            {
                return true;
            }
        }

        return false;
    }

    ResolveCasterEffect(candidate, shadowEffect, skinnedShadowEffect)
    {
        if (this.IsCasterSkinned(candidate))
        {
            return skinnedShadowEffect || shadowEffect;
        }

        return shadowEffect;
    }

    ResolveTechnique(effect, preferred = "Shadow")
    {
        if (!effect || typeof effect.HasTechnique !== "function")
        {
            return null;
        }

        const candidates = [ preferred, "Shadow", "Depth", "Main" ];
        for (let i = 0; i < candidates.length; i++)
        {
            if (effect.HasTechnique(candidates[i]))
            {
                return candidates[i];
            }
        }

        if (effect.defaultTechnique && effect.HasTechnique(effect.defaultTechnique))
        {
            return effect.defaultTechnique;
        }

        return null;
    }

    CaptureAlphaState()
    {
        const alpha = device._alphaTestState;
        if (!alpha || !alpha.states)
        {
            return null;
        }

        return {
            enabled: alpha.states[RS_ALPHATESTENABLE],
            ref: alpha.states[RS_ALPHAREF],
            func: alpha.states[RS_ALPHAFUNC],
            dirty: alpha.dirty
        };
    }

    SetAlphaState()
    {
        const alpha = device._alphaTestState;
        if (!alpha || !alpha.states)
        {
            return false;
        }

        alpha.states[RS_ALPHATESTENABLE] = 1;
        alpha.states[RS_ALPHAFUNC] = CMP_GREATEREQUAL;
        alpha.states[RS_ALPHAREF] = 0;
        alpha.dirty = true;
        if (typeof device.ApplyShadowState === "function")
        {
            device.ApplyShadowState();
        }
        return true;
    }

    RestoreAlphaState(snapshot)
    {
        const alpha = device._alphaTestState;
        if (!alpha || !alpha.states || !snapshot)
        {
            return;
        }

        alpha.states[RS_ALPHATESTENABLE] = snapshot.enabled;
        alpha.states[RS_ALPHAREF] = snapshot.ref;
        alpha.states[RS_ALPHAFUNC] = snapshot.func;
        alpha.dirty = snapshot.dirty;

        if (typeof device.ApplyShadowState === "function")
        {
            device.ApplyShadowState();
        }
    }

    RenderBatches(rt, accumulator, options = {})
    {
        if (!rt || !rt.IsGood() || !accumulator || !accumulator.length)
        {
            return 0;
        }

        const targetName = options.preferredTechnique || "Shadow";
        const fallbackEffect = options.fallbackEffect || null;
        const previousPerObjectData = device.perObjectData;
        const touchedEffects = new Map();
        const alphaState = this.CaptureAlphaState();
        let rendered = 0;

        const restore = () =>
        {
            device.perObjectData = previousPerObjectData;
            this.RestoreAlphaState(alphaState);

            for (const [ effect, previousValue ] of touchedEffects)
            {
                if (effect)
                {
                    effect._isShadowEffect = previousValue;
                }
            }
        };

        try
        {
            this.SetAlphaState();

            for (let i = 0; i < accumulator.length; i++)
            {
                const batch = accumulator.batches[i];
                if (!batch || typeof batch.Commit !== "function")
                {
                    continue;
                }

                if (typeof batch.renderMode === "number" && batch.renderMode !== null && batch.renderMode !== device.RM_ANY)
                {
                    device.SetStandardStates(batch.renderMode);
                }

                let batchEffect = batch.effect || fallbackEffect;
                if (!batchEffect)
                {
                    continue;
                }

                const hasTechnique = typeof batchEffect.HasTechnique === "function";
                const technique = hasTechnique ? this.ResolveTechnique(batchEffect, targetName) : "Main";
                if (!technique)
                {
                    continue;
                }

                if (!touchedEffects.has(batchEffect))
                {
                    touchedEffects.set(batchEffect, batchEffect._isShadowEffect);
                }
                batchEffect._isShadowEffect = true;
                batch.effect = batchEffect;
                batch._isShadowEffect = true;

                device.perObjectData = batch.perObjectData;
                if (batch.Commit(technique) !== false)
                {
                    rendered++;
                }
            }
        }
        finally
        {
            restore();
        }

        return rendered;
    }

    GetBatches(modes = RM_OPAQUE, accumulator, options = {})
    {
        if (!this.collectBatches || !accumulator || typeof accumulator.Commit !== "function")
        {
            return false;
        }

        const normalizedModes = EveSpaceSceneShadowHandler.ResolveRenderModes(modes);
        if (!normalizedModes.includes(RM_OPAQUE))
        {
            return false;
        }

        const
            scene = this.scene,
            show = scene ? scene.visible : {},
            dt = Number.isFinite(options.dt) ? options.dt : 0,
            includeObjects = options.includeObjects !== false,
            includeBackgroundObjects = options.includeBackgroundObjects !== false,
            shadowEffect = options.shadowEffect || this.EnsureEffect(false),
            skinnedShadowEffect = options.skinnedShadowEffect || this.EnsureEffect(true);

        if (!scene || !shadowEffect)
        {
            return false;
        }

        const seen = new Set();
        let found = false;
        this._report.casters = 0;

        if (show.backgroundObjects && includeBackgroundObjects && Array.isArray(scene.backgroundObjects))
        {
            found = this.CollectFromArray(scene.backgroundObjects, accumulator, seen, dt, shadowEffect, skinnedShadowEffect) || found;
        }

        if (show.objects && includeObjects && Array.isArray(scene.objects))
        {
            found = this.CollectFromArray(scene.objectsByDistance, accumulator, seen, dt, shadowEffect, skinnedShadowEffect) || found;
        }

        return found;
    }

    CollectFromArray(array, accumulator, seen, dt, shadowEffect, skinnedShadowEffect)
    {
        let found = false;

        for (let i = 0; i < array.length; i++)
        {
            const candidate = array[i];
            if (!candidate || seen.has(candidate))
            {
                continue;
            }
            seen.add(candidate);

            if (typeof candidate.UpdateViewDependentData === "function")
            {
                candidate.UpdateViewDependentData(this.scene._localTransform, dt);
            }

            const effect = this.ResolveCasterEffect(candidate, shadowEffect, skinnedShadowEffect);
            if (this.CollectObjectBatches(candidate, accumulator, effect))
            {
                this._report.casters++;
                found = true;
            }
        }

        return found;
    }

    CollectObjectBatches(candidate, accumulator, effect)
    {
        if (
            !candidate ||
            !candidate.display ||
            candidate.visible?.shadows === false ||
            !candidate.mesh ||
            !candidate.mesh.IsGood ||
            !candidate.mesh.IsGood() ||
            !effect ||
            !effect.IsGood()
        )
        {
            return false;
        }

        const
            mesh = candidate.mesh,
            perObjectData = this.CreatePerObjectData(candidate, effect),
            before = accumulator.length;

        if (!mesh.visible || mesh.visible.opaqueAreas !== false)
        {
            this.CollectAreaBatches(mesh, mesh.opaqueAreas, accumulator, perObjectData, effect);
        }

        if (!mesh.visible || mesh.visible.depthAreas !== false)
        {
            this.CollectAreaBatches(mesh, mesh.depthAreas, accumulator, perObjectData, effect);
        }

        return accumulator.length !== before;
    }

    CollectAreaBatches(mesh, areas, accumulator, perObjectData, effect)
    {
        if (!areas || !areas.length || !mesh.geometryResource)
        {
            return false;
        }

        const before = accumulator.length;
        for (let i = 0; i < areas.length; i++)
        {
            const area = areas[i];
            if (!area || !area.display)
            {
                continue;
            }

            const BatchType = area.constructor && area.constructor.batchType;
            if (!BatchType)
            {
                continue;
            }

            const batch = new BatchType();
            batch.renderMode = RM_OPAQUE;
            batch.perObjectData = perObjectData;
            batch.geometryRes = mesh.geometryResource;
            batch.meshIx = area.meshIndex;
            batch.start = area.index;
            batch.count = area.count;
            batch.effect = effect;
            batch._isShadowEffect = true;
            accumulator.Commit(batch);
        }

        return accumulator.length !== before;
    }

    CreatePerObjectData(candidate)
    {
        const
            source = candidate && candidate._perObjectData,
            sourceVS = source && source.vs,
            sourcePS = source && source.ps,
            skinned = this.IsCasterSkinned(candidate),
            out = new Tw2PerObjectData();

        if (skinned && sourceVS)
        {
            out.vs = sourceVS;
        }
        else
        {
            out.vs = Tw2RawData.from([
                [ "WorldMat", 16 ]
            ]);
            EveSpaceSceneShadowHandler.CopyRawData(sourceVS, out.vs, "WorldMat");
        }

        out.ps = Tw2RawData.from([
            [ "Shipdata", [ 0, 1, 0, 1 ] ],
            [ "Clipdata1", 4 ],
            [ "Miscdata", 4 ]
        ]);
        EveSpaceSceneShadowHandler.CopyRawData(sourcePS, out.ps, "Shipdata");
        EveSpaceSceneShadowHandler.CopyRawData(sourcePS, out.ps, "Clipdata1");
        EveSpaceSceneShadowHandler.CopyRawData(sourcePS, out.ps, "Miscdata");

        return out;
    }

    UpdateMatrices(scene = this.scene)
    {
        const
            g = EveSpaceSceneShadowHandler.global,
            minBounds = g.vec3_1,
            maxBounds = g.vec3_2,
            center = g.vec3_3,
            sunDir = scene.GetPerFrameSunDirection(g.vec3_4),
            eye = g.vec3_5,
            up = g.vec3_6,
            lightMin = g.vec3_7,
            lightMax = g.vec3_8,
            point = g.vec3_9,
            corners = this._frustumCorners;

        const hasFrustumBounds = this.fitCameraFrustum
            ? this.BuildCameraFrustumBounds(minBounds, maxBounds, center)
            : false;

        if (!hasFrustumBounds)
        {
            const count = this.CollectBounds(minBounds, maxBounds);
            if (count)
            {
                vec3.add(center, minBounds, maxBounds);
                vec3.scale(center, center, 0.5);
            }
            else
            {
                mat4.getTranslation(center, device.viewInverse);
                const fallbackDistance = Math.max(1000, Math.min(device.farPlane || 10000, 10000) * 0.25);
                vec3.set(minBounds, center[0] - fallbackDistance, center[1] - fallbackDistance, center[2] - fallbackDistance);
                vec3.set(maxBounds, center[0] + fallbackDistance, center[1] + fallbackDistance, center[2] + fallbackDistance);
            }

            this.SetFrustumCornersFromBounds(minBounds, maxBounds);
        }

        const radius = Math.max(
            vec3.distance(center, minBounds),
            vec3.distance(center, maxBounds),
            1
        );
        const depth = Math.max(radius * 2.5, 1);

        vec3.scaleAndAdd(eye, center, sunDir, depth);
        vec3.set(up, 0, 1, 0);

        if (Math.abs(vec3.dot(sunDir, up)) > 0.95)
        {
            vec3.set(up, 0, 0, 1);
        }

        mat4.lookAtD3D(this._view, eye, center, up);

        vec3.set(lightMin, Infinity, Infinity, Infinity);
        vec3.set(lightMax, -Infinity, -Infinity, -Infinity);

        for (let i = 0; i < corners.length; i++)
        {
            vec3.transformMat4(point, corners[i], this._view);
            this.ExpandBoundsFromPoint(lightMin, lightMax, point);
        }

        const padding = Math.max(radius * 0.05, 1);
        let
            left = lightMin[0] - padding,
            right = lightMax[0] + padding,
            bottom = lightMin[1] - padding,
            top = lightMax[1] + padding;

        const
            size = Math.max(1, this.atlasSize || 1),
            width = Math.max(right - left, 1),
            height = Math.max(top - bottom, 1),
            texelX = width / size,
            texelY = height / size,
            centerX = Math.floor(((left + right) * 0.5) / texelX) * texelX,
            centerY = Math.floor(((bottom + top) * 0.5) / texelY) * texelY;

        left = centerX - width * 0.5;
        right = centerX + width * 0.5;
        bottom = centerY - height * 0.5;
        top = centerY + height * 0.5;

        const
            near = Math.max(0, lightMin[2] - padding),
            far = Math.max(near + 1, lightMax[2] + padding);

        mat4.orthoD3D(this._projection, left, right, bottom, top, near, far);
        mat4.multiply(this._viewProjection, this._projection, this._view);

        this.cameraNear = near;
        this.cameraFar = far;
    }

    CollectBounds(minBounds, maxBounds)
    {
        vec3.set(minBounds, Infinity, Infinity, Infinity);
        vec3.set(maxBounds, -Infinity, -Infinity, -Infinity);

        let count = this.CollectBoundsFromArray(this.scene.objects, minBounds, maxBounds);
        if (!count)
        {
            count += this.CollectBoundsFromArray(this.scene.backgroundObjects, minBounds, maxBounds);
        }

        return count;
    }

    CollectBoundsFromArray(array, minBounds, maxBounds)
    {
        if (!array || !array.length)
        {
            return 0;
        }

        const sphere = EveSpaceSceneShadowHandler.global.vec4_0;
        let count = 0;

        for (let i = 0; i < array.length; i++)
        {
            if (this.GetObjectSphere(array[i], sphere))
            {
                this.ExpandBoundsFromSphere(minBounds, maxBounds, sphere);
                count++;
            }
        }

        return count;
    }

    GetObjectSphere(object, out)
    {
        if (!object)
        {
            return false;
        }

        if (typeof object.GetWorldBoundingSphere === "function")
        {
            const result = object.GetWorldBoundingSphere(out, false);
            if (this.IsValidSphere(result))
            {
                return true;
            }
        }

        if (typeof object.GetBoundingSphere === "function")
        {
            const result = object.GetBoundingSphere(out, false);
            if (this.IsValidSphere(result))
            {
                this.TransformSphere(object, out);
                return this.IsValidSphere(out);
            }
        }

        if (Number.isFinite(object.boundingSphereRadius) && object.boundingSphereRadius > 0)
        {
            const center = object.boundingSphereCenter || EveSpaceSceneShadowHandler.global.vec3_ZERO;
            out[0] = center[0] || 0;
            out[1] = center[1] || 0;
            out[2] = center[2] || 0;
            out[3] = object.boundingSphereRadius;
            this.TransformSphere(object, out);
            return this.IsValidSphere(out);
        }

        return false;
    }

    TransformSphere(object, sphere)
    {
        const transform = this.GetObjectTransform(object);
        if (!transform)
        {
            return sphere;
        }

        vec3.transformMat4(sphere, sphere, transform);
        sphere[3] *= this.GetMaxTransformScale(transform);
        return sphere;
    }

    GetObjectTransform(object)
    {
        const m = EveSpaceSceneShadowHandler.global.mat4_2;

        if (typeof object.GetWorldTransform === "function")
        {
            return object.GetWorldTransform(m);
        }

        if (typeof object.GetTransform === "function")
        {
            return object.GetTransform(m);
        }

        return object._worldTransform || object.transform || null;
    }

    GetMaxTransformScale(m)
    {
        const sx = Math.hypot(m[0], m[1], m[2]);
        const sy = Math.hypot(m[4], m[5], m[6]);
        const sz = Math.hypot(m[8], m[9], m[10]);
        return Math.max(sx, sy, sz, 1);
    }

    IsValidSphere(sphere)
    {
        return !!sphere
            && Number.isFinite(sphere[0])
            && Number.isFinite(sphere[1])
            && Number.isFinite(sphere[2])
            && Number.isFinite(sphere[3])
            && sphere[3] > 0;
    }

    ExpandBoundsFromSphere(minBounds, maxBounds, sphere)
    {
        const radius = Math.max(sphere[3], 1);

        minBounds[0] = Math.min(minBounds[0], sphere[0] - radius);
        minBounds[1] = Math.min(minBounds[1], sphere[1] - radius);
        minBounds[2] = Math.min(minBounds[2], sphere[2] - radius);

        maxBounds[0] = Math.max(maxBounds[0], sphere[0] + radius);
        maxBounds[1] = Math.max(maxBounds[1], sphere[1] + radius);
        maxBounds[2] = Math.max(maxBounds[2], sphere[2] + radius);
    }

    BuildCameraFrustumBounds(minBounds, maxBounds, center)
    {
        device.UpdateViewProjection();
        this._frustum.Initialize(
            device.view,
            device.projection,
            device.viewportWidth,
            device.viewInverse,
            device.viewProjection,
            device.viewProjectionInverse
        );

        const
            fullNear = Math.max(Number.isFinite(device.nearPlane) ? device.nearPlane : 1, 1e-3),
            fullFar = Number.isFinite(device.farPlane) && device.farPlane > fullNear
                ? device.farPlane
                : Math.max(this.frustumFar, fullNear + 1),
            splitNear = Math.max(fullNear, Math.min(this.frustumNear, fullFar - 1e-3)),
            splitFar = Math.max(splitNear + 1e-3, Math.min(this.frustumFar, fullFar)),
            corners = this._frustumCorners;

        this._frustum.GetDistanceSplitCorners(corners, splitNear, splitFar, fullNear, fullFar);

        vec3.set(minBounds, Infinity, Infinity, Infinity);
        vec3.set(maxBounds, -Infinity, -Infinity, -Infinity);
        vec3.set(center, 0, 0, 0);

        for (let i = 0; i < corners.length; i++)
        {
            this.ExpandBoundsFromPoint(minBounds, maxBounds, corners[i]);
            vec3.add(center, center, corners[i]);
        }

        vec3.scale(center, center, 1 / corners.length);
        return true;
    }

    SetFrustumCornersFromBounds(minBounds, maxBounds)
    {
        const c = this._frustumCorners;

        vec3.set(c[0], minBounds[0], minBounds[1], minBounds[2]);
        vec3.set(c[1], maxBounds[0], minBounds[1], minBounds[2]);
        vec3.set(c[2], maxBounds[0], maxBounds[1], minBounds[2]);
        vec3.set(c[3], minBounds[0], maxBounds[1], minBounds[2]);
        vec3.set(c[4], minBounds[0], minBounds[1], maxBounds[2]);
        vec3.set(c[5], maxBounds[0], minBounds[1], maxBounds[2]);
        vec3.set(c[6], maxBounds[0], maxBounds[1], maxBounds[2]);
        vec3.set(c[7], minBounds[0], maxBounds[1], maxBounds[2]);
    }

    ExpandBoundsFromPoint(minBounds, maxBounds, point)
    {
        minBounds[0] = Math.min(minBounds[0], point[0]);
        minBounds[1] = Math.min(minBounds[1], point[1]);
        minBounds[2] = Math.min(minBounds[2], point[2]);

        maxBounds[0] = Math.max(maxBounds[0], point[0]);
        maxBounds[1] = Math.max(maxBounds[1], point[1]);
        maxBounds[2] = Math.max(maxBounds[2], point[2]);
    }

    DirtyDeviceState()
    {
        device._currentRenderMode = null;

        if (device._alphaBlendState)
        {
            device._alphaBlendState.dirty = true;
        }

        if (device._alphaTestState)
        {
            device._alphaTestState.dirty = true;
        }

        if (device._depthOffsetState)
        {
            device._depthOffsetState.dirty = true;
        }

        if (device._renderStates)
        {
            for (const mode of Object.keys(device._renderStates))
            {
                if (device._renderStates[mode])
                {
                    device._renderStates[mode].dirty = true;
                }
            }
        }
    }

    static ApplyDisabledFrameData(scene)
    {
        if (!scene)
        {
            return false;
        }

        const identity = EveSpaceSceneShadowHandler.global.mat4_IDENTITY;
        scene._perFrameVS.Set("ShadowViewMat", identity);
        scene._perFrameVS.Set("ShadowViewProjectionMat", identity);
        scene._perFramePS.Set("ShadowMapSettings", [ 0, 0, 0, 0 ]);
        scene._perFramePS.Set("ShadowCameraRange", [ 1, 1, 0, 0 ]);
        device.perFrameShadowVSData = null;
        device.perFrameShadowPSData = null;
        EveSpaceSceneShadowHandler.ResetFallbackVariables();
        return true;
    }

    static EnsureFallbackVariables()
    {
        if (!tw2.HasVariable("EveSpaceSceneShadowMap"))
        {
            tw2.SetVariable("EveSpaceSceneShadowMap", "rgba:/255,255,255,255");
        }

        if (!tw2.HasVariable("EveSpaceSceneCascadedShadowMap"))
        {
            tw2.SetVariable("EveSpaceSceneCascadedShadowMap", "rgba:/0,0,0,255");
        }
    }

    static ResetFallbackVariables()
    {
        if (tw2.HasVariable("EveSpaceSceneShadowMap"))
        {
            tw2.SetVariable("EveSpaceSceneShadowMap", "rgba:/255,255,255,255");
        }
        else
        {
            tw2.SetVariable("EveSpaceSceneShadowMap", "rgba:/255,255,255,255");
        }

        if (tw2.HasVariable("EveSpaceSceneCascadedShadowMap"))
        {
            tw2.SetVariable("EveSpaceSceneCascadedShadowMap", "rgba:/0,0,0,255");
        }
        else
        {
            tw2.SetVariable("EveSpaceSceneCascadedShadowMap", "rgba:/0,0,0,255");
        }
    }

    static ResolveRenderModes(renderModes)
    {
        const input = Array.isArray(renderModes) ? renderModes : [ renderModes ];
        const out = [];
        const modeSet = new Set();
        const modeMap = { RM_OPAQUE };

        for (let i = 0; i < input.length; i++)
        {
            const mode = input[i];
            let resolved = null;

            if (Number.isFinite(mode))
            {
                resolved = mode;
            }
            else if (typeof mode === "string")
            {
                resolved = modeMap[mode.trim().toUpperCase()] || modeMap[`RM_${mode.trim().toUpperCase()}`];
            }

            if (Number.isFinite(resolved) && !modeSet.has(resolved))
            {
                modeSet.add(resolved);
                out.push(resolved);
            }
        }

        return out;
    }

    static CopyRawData(source, target, name)
    {
        const value = EveSpaceSceneShadowHandler.SafeGetRawData(source, name);
        if (value && target && typeof target.Has === "function" && target.Has(name))
        {
            target.Set(name, value);
            return true;
        }
        return false;
    }

    static SafeGetRawData(raw, name)
    {
        if (!raw || typeof raw.Has !== "function" || !raw.Has(name) || typeof raw.Get !== "function")
        {
            return null;
        }

        try
        {
            return raw.Get(name);
        }
        catch
        {
            return null;
        }
    }

    static perFrameData = {
        vs: [
            [ "ShadowViewProjection", 16 ],
            [ "ShadowView", 16 ],
            [ "ShadowNearFar", 4 ]
        ],
        ps: []
    };

    static global = {
        vec3_ZERO: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create(),
        vec3_3: vec3.create(),
        vec3_4: vec3.create(),
        vec3_5: vec3.create(),
        vec3_6: vec3.create(),
        vec3_7: vec3.create(),
        vec3_8: vec3.create(),
        vec3_9: vec3.create(),
        vec4_0: vec4.create(),
        mat4_0: mat4.create(),
        mat4_1: mat4.create(),
        mat4_2: mat4.create(),
        mat4_IDENTITY: mat4.create()
    };

}
