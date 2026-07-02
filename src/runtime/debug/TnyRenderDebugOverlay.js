import { device, tw2 } from "global";


/**
 * Small opt-in render debug overlay for showing pass textures and reports.
 */
export class TnyRenderDebugOverlay
{
    enabled = true;
    mode = "all";
    x = 8;
    y = 8;
    width = 300;
    height = 170;
    gap = 10;
    padding = 7;
    lineHeight = 15;
    headerHeight = 58;
    font = "13px monospace";
    label = true;
    labelPlacement = "above";
    useDomLabels = true;
    clearLabels = true;
    background = true;
    backgroundStyle = "rgba(0, 0, 0, 0.68)";
    panelStyle = "rgba(0, 0, 0, 0.62)";
    borderStyle = "rgba(139, 213, 255, 0.38)";
    textStyle = "rgba(255, 255, 255, 0.92)";
    accentStyle = "rgba(139, 213, 255, 0.95)";
    domClassName = "tny-render-debug-overlay";
    domZIndex = 2147483000;

    slots = [];
    _target = null;
    _method = null;
    _original = null;
    _wrapper = null;
    _lastError = null;
    _domRoot = null;

    constructor(options = {})
    {
        const { scene, slots, mode, install, target, ...rest } = options;
        this.SetOptions(rest);
        if (mode) this.SetMode(mode);
        if (slots) this.AddSlots(slots);
        if (scene) this.AddScenePasses(scene);
        if (install) this.Install(target);
    }

    /**
     * Sets overlay options.
     * @param {Object} options
     * @returns {TnyRenderDebugOverlay}
     */
    SetOptions(options = {})
    {
        for (const key of [
            "enabled", "label", "clearLabels", "background",
            "backgroundStyle", "panelStyle", "borderStyle", "textStyle",
            "accentStyle", "font", "mode", "labelPlacement", "useDomLabels",
            "domClassName"
        ])
        {
            if (key in options) this[key] = options[key];
        }

        for (const key of [ "x", "y", "width", "height", "gap", "padding", "lineHeight", "headerHeight", "domZIndex" ])
        {
            if (Number.isFinite(options[key])) this[key] = Math.max(0, Math.floor(options[key]));
        }

        return this;
    }

    /**
     * Sets the visible slot mode.
     * @param {String} mode
     * @returns {TnyRenderDebugOverlay}
     */
    SetMode(mode = "all")
    {
        this.mode = mode || "all";
        return this;
    }

    /**
     * Enables or disables the overlay.
     * @param {Boolean} enabled
     * @returns {TnyRenderDebugOverlay}
     */
    SetEnabled(enabled = true)
    {
        this.enabled = !!enabled;
        return this;
    }

    /**
     * Adds multiple slots.
     * @param {Array} slots
     * @returns {TnyRenderDebugOverlay}
     */
    AddSlots(slots = [])
    {
        for (let i = 0; i < slots.length; i++)
        {
            this.AddSlot(slots[i]);
        }
        return this;
    }

    /**
     * Adds a debug slot.
     * @param {Object|String} slot
     * @param {*} [texture]
     * @param {Object} [options]
     * @returns {Object}
     */
    AddSlot(slot, texture, options = {})
    {
        if (typeof slot === "string")
        {
            slot = { name: slot, texture, ...options };
        }

        const normalized = {
            enabled: true,
            width: this.width,
            height: this.height,
            modes: null,
            tag: "",
            label: slot.name || "debug",
            panel: false,
            ...slot
        };

        if (!normalized.name)
        {
            normalized.name = normalized.label || `slot${this.slots.length}`;
        }

        if (!Array.isArray(normalized.modes) && normalized.mode)
        {
            normalized.modes = [ normalized.mode ];
        }

        this.slots.push(normalized);
        return normalized;
    }

    /**
     * Adds a texture slot.
     * @param {String} name
     * @param {*} texture
     * @param {Object} [options]
     * @returns {Object}
     */
    AddTexture(name, texture, options = {})
    {
        return this.AddSlot({ name, texture, ...options });
    }

    /**
     * Adds a data-only report slot.
     * @param {String} name
     * @param {Function|Array|Object} getLines
     * @param {Object} [options]
     * @returns {Object}
     */
    AddReport(name, getLines, options = {})
    {
        return this.AddSlot({
            name,
            label: options.label || name,
            getLines,
            width: options.width || this.width,
            height: options.height || 92,
            panel: true,
            ...options
        });
    }

    /**
     * Removes slots with a matching tag.
     * @param {String} tag
     * @returns {TnyRenderDebugOverlay}
     */
    RemoveSlotsByTag(tag)
    {
        this.slots = this.slots.filter(slot => slot.tag !== tag);
        return this;
    }

    /**
     * Removes all slots.
     * @returns {TnyRenderDebugOverlay}
     */
    Clear()
    {
        this.slots.length = 0;
        return this;
    }

    /**
     * Adds standard Eve space scene pass slots.
     * @param {*} scene
     * @param {Object} [options]
     * @returns {TnyRenderDebugOverlay}
     */
    AddScenePasses(scene = TnyRenderDebugOverlay.ResolveScene(), options = {})
    {
        const eveScene = TnyRenderDebugOverlay.ResolveScene(scene);
        this.RemoveSlotsByTag("scene");
        if (!eveScene) return this;

        if (options.internal !== false)
        {
            this.AddTexture("internal", () => eveScene._internalRenderTarget?.texture, {
                tag: "scene",
                label: "internal",
                modes: [ "all", "internal", "depth", "distortion" ],
                getLines: () => this.GetSceneInternalLines(eveScene)
            });
        }

        if (options.shadow !== false)
        {
            this.AddTexture("shadow", () => TnyRenderDebugOverlay.GetSceneShadowHandler(eveScene)?._renderTarget?.texture, {
                tag: "scene",
                label: "shadow",
                modes: [ "all", "shadow" ],
                getLines: () => this.GetSceneShadowLines(eveScene)
            });
        }

        if (options.reports !== false)
        {
            this.AddReport("reports", () => this.GetSceneReportLines(eveScene), {
                tag: "scene",
                label: "reports",
                modes: [ "all", "reports", "data" ],
                height: options.reportHeight || 88
            });
        }

        return this;
    }

    /**
     * Installs the overlay after a target Render method.
     * @param {*} [target]
     * @param {String} [method="Render"]
     * @returns {TnyRenderDebugOverlay}
     */
    Install(target = TnyRenderDebugOverlay.ResolveInstallTarget(), method = "Render")
    {
        if (!target || typeof target[method] !== "function")
        {
            throw new TypeError("Invalid render target");
        }

        this.Uninstall();

        const overlay = this;
        const original = target[method];
        const wrapper = function(...args)
        {
            const result = original.apply(this, args);
            try
            {
                overlay.Render();
            }
            catch (err)
            {
                overlay._lastError = err;
            }
            return result;
        };

        target[method] = wrapper;
        this._target = target;
        this._method = method;
        this._original = original;
        this._wrapper = wrapper;
        return this;
    }

    /**
     * Uninstalls an attached render wrapper.
     * @returns {TnyRenderDebugOverlay}
     */
    Uninstall()
    {
        if (this._target && this._method && this._target[this._method] === this._wrapper)
        {
            this._target[this._method] = this._original;
        }

        this._target = null;
        this._method = null;
        this._original = null;
        this._wrapper = null;
        this.RemoveDomLabels();
        return this;
    }

    /**
     * Renders visible debug slots.
     * @returns {Boolean}
     */
    Render()
    {
        if (!this.enabled || !device.gl || device.gl.isContextLost?.())
        {
            return false;
        }

        const slots = this.GetDisplaySlots();
        if (!slots.length)
        {
            return false;
        }

        const gl = device.gl;
        const state = TnyRenderDebugOverlay.CaptureGLState(gl);
        let rendered = false;

        try
        {
            gl.disable(gl.SCISSOR_TEST);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.depthMask(false);

            for (let i = 0; i < slots.length; i++)
            {
                if (slots[i].panel) continue;

                let texture;
                try
                {
                    texture = this.ResolveTexture(slots[i]);
                }
                catch (err)
                {
                    this._lastError = err;
                    continue;
                }

                if (!texture) continue;

                const tile = this.GetSlotRect(i, slots[i], slots);
                gl.viewport(tile.x, tile.y, tile.width, tile.height);
                rendered = tw2.device.RenderTexture(texture) || rendered;
            }
        }
        finally
        {
            TnyRenderDebugOverlay.RestoreGLState(gl, state);
            TnyRenderDebugOverlay.DirtyDeviceState();
        }

        this.RenderLabels(slots);
        return rendered;
    }

    /**
     * Gets visible slots.
     * @returns {Array}
     */
    GetVisibleSlots()
    {
        return this.slots.filter(slot =>
            slot &&
            slot.enabled !== false &&
            (this.mode === "all" || !slot.modes || slot.modes.includes(this.mode))
        );
    }

    /**
     * Gets slots that should occupy overlay space this frame.
     * @returns {Array}
     */
    GetDisplaySlots()
    {
        return this.GetVisibleSlots().filter(slot =>
        {
            if (slot.panel || slot.alwaysShow) return true;
            return !!this.TryResolveTexture(slot);
        });
    }

    /**
     * Resolves a slot texture without throwing.
     * @param {Object} slot
     * @returns {*}
     */
    TryResolveTexture(slot)
    {
        try
        {
            return this.ResolveTexture(slot);
        }
        catch (err)
        {
            this._lastError = err;
            return null;
        }
    }

    /**
     * Gets a slot rectangle in WebGL viewport coordinates.
     * @param {Number} index
     * @param {Object} slot
     * @param {Object[]} [slots]
     * @returns {{x:Number,y:Number,width:Number,height:Number}}
     */
    GetSlotRect(index, slot, slots = this.GetDisplaySlots())
    {
        const width = Math.max(1, Math.floor(slot.width || this.width));
        const height = Math.max(1, Math.floor(slot.height || this.height));
        let y = this.y;

        for (let i = 0; i < index; i++)
        {
            y += this.GetSlotExtentHeight(slots[i]) + this.gap;
        }

        return {
            x: this.x,
            y,
            width,
            height
        };
    }

    /**
     * Gets the total vertical slot space in WebGL coordinates.
     * @param {Object} slot
     * @returns {Number}
     */
    GetSlotExtentHeight(slot)
    {
        const height = Math.max(1, Math.floor(slot?.height || this.height));
        if (!slot || slot.panel || !this.label || this.labelPlacement !== "above")
        {
            return height;
        }
        return height + this.GetSlotHeaderHeight(slot, this.ResolveLinesSafe(slot));
    }

    /**
     * Gets a slot header height.
     * @param {Object} slot
     * @param {String[]} [lines]
     * @returns {Number}
     */
    GetSlotHeaderHeight(slot, lines)
    {
        if (!this.label || slot?.panel || this.labelPlacement !== "above")
        {
            return 0;
        }

        const lineCount = lines ? lines.length : 3;
        return Math.max(
            this.headerHeight,
            this.padding * 2 + lineCount * this.lineHeight
        );
    }

    /**
     * Resolves a slot texture-like value.
     * @param {Object} slot
     * @returns {*}
     */
    ResolveTexture(slot)
    {
        let value = slot.getTexture ? slot.getTexture(slot, this) : slot.texture;
        if (typeof value === "function")
        {
            value = value(slot, this);
        }
        if (!value) return null;
        if (value.textureRes) return value;
        if (value._frameBuffer && value.texture) return value.texture;
        return value;
    }

    /**
     * Renders labels and reports to the 2d overlay canvas when available.
     * @param {Array} slots
     * @returns {Boolean}
     */
    RenderLabels(slots)
    {
        if (!this.label)
        {
            return false;
        }

        if (this.useDomLabels)
        {
            return this.RenderDomLabels(slots);
        }

        if (!device.canvas2d) return false;

        const canvas = device.canvas2d;
        const ctx = canvas.getContext("2d");
        if (!ctx) return false;

        ctx.save();
        ctx.font = this.font;
        ctx.textBaseline = "top";

        for (let i = 0; i < slots.length; i++)
        {
            const slot = slots[i];
            const lines = this.ResolveLinesSafe(slot);

            if (!lines.length) continue;

            const tile = this.GetSlotRect(i, slot, slots);
            const labelRect = this.GetLabelRect(slot, tile, lines, canvas);
            const textureRect = this.MapGLRectToCanvas(tile, canvas);

            if (this.clearLabels)
            {
                ctx.clearRect(labelRect.left, labelRect.top, labelRect.width, labelRect.height);
            }

            if (this.background)
            {
                ctx.fillStyle = slot.panel ? this.panelStyle : this.backgroundStyle;
                ctx.fillRect(labelRect.left, labelRect.top, labelRect.width, labelRect.height);
            }

            if (this.borderStyle)
            {
                ctx.strokeStyle = this.borderStyle;
                ctx.strokeRect(labelRect.left + 0.5, labelRect.top + 0.5, labelRect.width - 1, labelRect.height - 1);
                if (!slot.panel)
                {
                    ctx.strokeRect(textureRect.left + 0.5, textureRect.top + 0.5, textureRect.width - 1, textureRect.height - 1);
                }
            }

            for (let j = 0; j < lines.length; j++)
            {
                ctx.fillStyle = j === 0 ? this.accentStyle : this.textStyle;
                ctx.fillText(lines[j], labelRect.left + this.padding, labelRect.top + this.padding + j * this.lineHeight);
            }
        }

        ctx.restore();
        return true;
    }

    /**
     * Renders readable labels into a DOM overlay above the WebGL canvas.
     * @param {Array} slots
     * @returns {Boolean}
     */
    RenderDomLabels(slots)
    {
        const root = this.EnsureDomLabels();
        if (!root) return false;

        root.innerHTML = "";

        for (let i = 0; i < slots.length; i++)
        {
            const slot = slots[i];
            const lines = this.ResolveLinesSafe(slot);
            if (!lines.length) continue;

            const tile = this.GetSlotRect(i, slot, slots);
            const rect = this.GetDomLabelRect(slot, tile, lines);
            if (!rect) continue;

            const panel = document.createElement("div");
            panel.style.position = "fixed";
            panel.style.left = `${rect.left}px`;
            panel.style.top = `${rect.top}px`;
            panel.style.width = `${rect.width}px`;
            panel.style.minHeight = `${rect.height}px`;
            panel.style.boxSizing = "border-box";
            panel.style.padding = `${this.padding}px`;
            panel.style.pointerEvents = "none";
            panel.style.background = slot.panel ? this.panelStyle : this.backgroundStyle;
            panel.style.border = `1px solid ${this.borderStyle}`;
            panel.style.color = this.textStyle;
            panel.style.font = this.font;
            panel.style.lineHeight = `${this.lineHeight}px`;
            panel.style.whiteSpace = "pre";
            panel.style.overflow = "hidden";
            panel.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.85)";

            for (let j = 0; j < lines.length; j++)
            {
                const line = document.createElement("div");
                line.textContent = lines[j];
                line.style.color = j === 0 ? this.accentStyle : this.textStyle;
                panel.appendChild(line);
            }

            root.appendChild(panel);
        }

        return true;
    }

    /**
     * Ensures the DOM label root exists.
     * @returns {?HTMLElement}
     */
    EnsureDomLabels()
    {
        if (this._domRoot && this._domRoot.isConnected)
        {
            return this._domRoot;
        }

        if (typeof document === "undefined" || !document.body)
        {
            return null;
        }

        const root = document.createElement("div");
        root.className = this.domClassName;
        root.style.position = "fixed";
        root.style.left = "0";
        root.style.top = "0";
        root.style.width = "0";
        root.style.height = "0";
        root.style.pointerEvents = "none";
        root.style.zIndex = String(this.domZIndex);
        document.body.appendChild(root);
        this._domRoot = root;
        return root;
    }

    /**
     * Removes DOM labels.
     */
    RemoveDomLabels()
    {
        if (this._domRoot)
        {
            this._domRoot.remove();
            this._domRoot = null;
        }
    }

    /**
     * Gets the label rectangle in 2d canvas coordinates.
     * @param {Object} slot
     * @param {Object} tile
     * @param {String[]} lines
     * @param {HTMLCanvasElement} canvas
     * @returns {{left:Number,top:Number,width:Number,height:Number}}
     */
    GetLabelRect(slot, tile, lines, canvas)
    {
        if (slot.panel)
        {
            return this.MapGLRectToCanvas(tile, canvas);
        }

        if (this.labelPlacement === "above")
        {
            const headerHeight = this.GetSlotHeaderHeight(slot, lines);
            return this.MapGLRectToCanvas({
                x: tile.x,
                y: tile.y + tile.height,
                width: tile.width,
                height: headerHeight
            }, canvas);
        }

        const rect = this.MapGLRectToCanvas(tile, canvas);
        rect.height = Math.min(rect.height, this.padding * 2 + lines.length * this.lineHeight);
        return rect;
    }

    /**
     * Gets a DOM label rectangle in CSS pixels.
     * @param {Object} slot
     * @param {Object} tile
     * @param {String[]} lines
     * @returns {?{left:Number,top:Number,width:Number,height:Number}}
     */
    GetDomLabelRect(slot, tile, lines)
    {
        if (slot.panel)
        {
            return this.MapGLRectToClient(tile);
        }

        if (this.labelPlacement === "above")
        {
            const headerHeight = this.GetSlotHeaderHeight(slot, lines);
            return this.MapGLRectToClient({
                x: tile.x,
                y: tile.y + tile.height,
                width: tile.width,
                height: headerHeight
            });
        }

        const rect = this.MapGLRectToClient(tile);
        if (rect)
        {
            rect.height = Math.min(rect.height, this.padding * 2 + lines.length * this.lineHeight);
        }
        return rect;
    }

    /**
     * Safely resolves text lines for a slot.
     * @param {Object} slot
     * @returns {String[]}
     */
    ResolveLinesSafe(slot)
    {
        try
        {
            return this.ResolveLines(slot);
        }
        catch (err)
        {
            this._lastError = err;
            return [ slot.label || slot.name || "debug", err.message || String(err) ];
        }
    }

    /**
     * Maps a WebGL viewport rectangle to the 2d overlay canvas.
     * @param {Object} rect
     * @param {HTMLCanvasElement} canvas
     * @returns {{left:Number,top:Number,width:Number,height:Number}}
     */
    MapGLRectToCanvas(rect, canvas)
    {
        const
            glCanvas = device.canvas,
            glRect = glCanvas?.getBoundingClientRect?.(),
            canvasRect = canvas?.getBoundingClientRect?.();

        if (glRect && canvasRect && glRect.width && glRect.height && canvasRect.width && canvasRect.height)
        {
            const
                glScaleX = glRect.width / (device.viewportWidth || glCanvas.width || glRect.width),
                glScaleY = glRect.height / (device.viewportHeight || glCanvas.height || glRect.height),
                canvasScaleX = canvas.width / canvasRect.width,
                canvasScaleY = canvas.height / canvasRect.height,
                cssLeft = glRect.left + rect.x * glScaleX,
                cssTop = glRect.top + glRect.height - (rect.y + rect.height) * glScaleY;

            return {
                left: Math.floor((cssLeft - canvasRect.left) * canvasScaleX),
                top: Math.floor((cssTop - canvasRect.top) * canvasScaleY),
                width: Math.floor(rect.width * glScaleX * canvasScaleX),
                height: Math.floor(rect.height * glScaleY * canvasScaleY)
            };
        }

        const
            scaleX = device.viewportWidth ? canvas.width / device.viewportWidth : 1,
            scaleY = device.viewportHeight ? canvas.height / device.viewportHeight : 1;

        return {
            left: Math.floor(rect.x * scaleX),
            top: Math.floor(canvas.height - (rect.y + rect.height) * scaleY),
            width: Math.floor(rect.width * scaleX),
            height: Math.floor(rect.height * scaleY)
        };
    }

    /**
     * Maps a WebGL viewport rectangle to client CSS pixels.
     * @param {Object} rect
     * @returns {?{left:Number,top:Number,width:Number,height:Number}}
     */
    MapGLRectToClient(rect)
    {
        const
            glCanvas = device.canvas,
            glRect = glCanvas?.getBoundingClientRect?.();

        if (!glRect || !glRect.width || !glRect.height)
        {
            return null;
        }

        const
            glScaleX = glRect.width / (device.viewportWidth || glCanvas.width || glRect.width),
            glScaleY = glRect.height / (device.viewportHeight || glCanvas.height || glRect.height);

        return {
            left: Math.floor(glRect.left + rect.x * glScaleX),
            top: Math.floor(glRect.top + glRect.height - (rect.y + rect.height) * glScaleY),
            width: Math.floor(rect.width * glScaleX),
            height: Math.floor(rect.height * glScaleY)
        };
    }

    /**
     * Resolves text lines for a slot.
     * @param {Object} slot
     * @returns {String[]}
     */
    ResolveLines(slot)
    {
        let lines = [];
        if (slot.label)
        {
            lines.push(String(slot.label));
        }

        let value = slot.getLines ? slot.getLines(slot, this) : slot.lines;
        if (typeof value === "function")
        {
            value = value(slot, this);
        }

        if (Array.isArray(value))
        {
            lines = lines.concat(value.map(String));
        }
        else if (value && typeof value === "object")
        {
            lines = lines.concat(Object.keys(value).map(key => `${key}: ${value[key]}`));
        }
        else if (value !== undefined && value !== null)
        {
            lines.push(String(value));
        }

        return lines;
    }

    /**
     * Gets standard internal target report lines.
     * @param {*} scene
     * @returns {String[]}
     */
    GetSceneInternalLines(scene)
    {
        const depth = scene.GetDepthContextReport?.();
        const distortion = scene.GetDistortionContextReport?.();

        return [
            `experimental: ${!!tw2.enableExperimentalBatchContext}`,
            `depth: ${TnyRenderDebugOverlay.FormatPassReport(depth, scene._depthAccumulator?.length)}`,
            `dist: ${TnyRenderDebugOverlay.FormatPassReport(distortion, scene._distortionAccumulator?.length)}`
        ];
    }

    /**
     * Gets standard shadow report lines.
     * @param {*} scene
     * @returns {String[]}
     */
    GetSceneShadowLines(scene)
    {
        const report = TnyRenderDebugOverlay.GetSceneShadowHandler(scene)?.GetReport?.();
        return [
            `enabled: ${!!tw2.enableExperimentalShadows}`,
            `status: ${report?.status || "none"}`,
            `rendered: ${report?.rendered ?? 0}/${report?.collected ?? 0}`
        ];
    }

    /**
     * Gets standard scene report lines.
     * @param {*} scene
     * @returns {String[]}
     */
    GetSceneReportLines(scene)
    {
        const report = scene.GetBatchContextReport?.();
        const depth = scene.GetDepthContextReport?.();
        const distortion = scene.GetDistortionContextReport?.();
        return [
            `batch: ${report ? `${report.rendered}/${report.batches}` : "-"}`,
            `depth: ${depth ? `${depth.rendered}/${depth.batches}` : scene._depthAccumulator?.length ?? "-"}`,
            `dist: ${distortion ? `${distortion.rendered}/${distortion.batches}` : scene._distortionAccumulator?.length ?? "-"}`,
            `mode: ${this.mode}`
        ];
    }

    /**
     * Gets the last render error.
     * @returns {*}
     */
    GetLastError()
    {
        return this._lastError;
    }

    /**
     * Creates and installs a scene overlay.
     * @param {Object} [options]
     * @returns {TnyRenderDebugOverlay}
     */
    static Install(options = {})
    {
        const overlay = new this({
            scene: options.scene || TnyRenderDebugOverlay.ResolveScene(),
            ...options,
            install: false
        });
        overlay.Install(options.target || TnyRenderDebugOverlay.ResolveInstallTarget(), options.method || "Render");
        return overlay;
    }

    /**
     * Resolves an Eve scene from wrapped or raw inputs.
     * @param {*} [scene]
     * @returns {*}
     */
    static ResolveScene(scene)
    {
        scene = scene || window.tiny?.scene || null;
        return scene?.wrapped || scene;
    }

    /**
     * Resolves the default install target.
     * @returns {*}
     */
    static ResolveInstallTarget()
    {
        return window.tiny?.scene || TnyRenderDebugOverlay.ResolveScene();
    }

    /**
     * Gets a scene's shadow handler without creating one.
     * @param {*} scene
     * @returns {*}
     */
    static GetSceneShadowHandler(scene)
    {
        return scene?.GetShadowHandler?.(false) || scene?.shadowHandler || null;
    }

    /**
     * Formats a pass report.
     * @param {?Object} report
     * @param {?Number} fallbackLength
     * @returns {String}
     */
    static FormatPassReport(report, fallbackLength)
    {
        if (report)
        {
            const ok = report.ok === false ? "bad" : "ok";
            return `${ok} ${report.rendered ?? 0}/${report.batches ?? report.length ?? 0}`;
        }
        if (fallbackLength !== undefined && fallbackLength !== null)
        {
            return `legacy ${fallbackLength}`;
        }
        return "-";
    }

    /**
     * Captures mutable GL state touched by the overlay.
     * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
     * @returns {Object}
     */
    static CaptureGLState(gl)
    {
        return {
            viewport: gl.getParameter(gl.VIEWPORT) || [ 0, 0, device.viewportWidth || 1, device.viewportHeight || 1 ],
            depthTest: gl.isEnabled(gl.DEPTH_TEST),
            scissorTest: gl.isEnabled(gl.SCISSOR_TEST),
            cullFace: gl.isEnabled(gl.CULL_FACE),
            blend: gl.isEnabled(gl.BLEND),
            depthMask: gl.getParameter(gl.DEPTH_WRITEMASK)
        };
    }

    /**
     * Restores mutable GL state touched by the overlay.
     * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
     * @param {Object} state
     */
    static RestoreGLState(gl, state)
    {
        if (!state || gl.isContextLost?.())
        {
            return;
        }

        if (state.depthTest) gl.enable(gl.DEPTH_TEST);
        else gl.disable(gl.DEPTH_TEST);

        if (state.scissorTest) gl.enable(gl.SCISSOR_TEST);
        else gl.disable(gl.SCISSOR_TEST);

        if (state.cullFace) gl.enable(gl.CULL_FACE);
        else gl.disable(gl.CULL_FACE);

        if (state.blend) gl.enable(gl.BLEND);
        else gl.disable(gl.BLEND);

        gl.depthMask(state.depthMask);
        if (state.viewport)
        {
            gl.viewport(state.viewport[0], state.viewport[1], state.viewport[2], state.viewport[3]);
        }
    }

    /**
     * Marks cached render states dirty after direct GL state changes.
     */
    static DirtyDeviceState()
    {
        device._currentRenderMode = null;

        for (const state of [ device._alphaBlendState, device._alphaTestState, device._depthOffsetState ])
        {
            if (state) state.dirty = true;
        }

        if (device._renderStates)
        {
            for (const mode of Object.keys(device._renderStates))
            {
                if (device._renderStates[mode]) device._renderStates[mode].dirty = true;
            }
        }
    }
}
