import { device } from "global";
import { Tw2Effect, Tw2RenderTarget } from "core";

// Content assembly, not part of Carbon's EvePlanet: the celestial supplies the
// terrain inputs, while the prepared shader determines how they are consumed.
export function applyPlanetHeightMaps(planet)
{
    if (!planet._heightMapBindings) planet._heightMapBindings = new Map();
    const bindings = planet._heightMapBindings;
    const effects = new Set();
    const seen = new Set();
    const visit = node =>
    {
        if (!node || typeof node !== "object" || seen.has(node)) return;
        seen.add(node);
        if (Array.isArray(node))
        {
            for (const item of node) visit(item);
        }
        else if (typeof node.SetTextures === "function") effects.add(node);
        else
        {
            for (const key of [ "effectChildren", "objects", "children", "child", "mesh", "effect",
                "opaqueAreas", "transparentAreas", "additiveAreas", "decalAreas", "depthAreas",
                "distortionAreas", "depthNormalAreas", "opaquePrepassAreas" ]) visit(node[key]);
        }
    };
    visit(planet.effectChildren);

    let bound = 0;
    for (const [ effect, state ] of bindings)
    {
        if (!effects.has(effect))
        {
            if (state.target) state.target.Destroy();
            bindings.delete(effect);
        }
    }

    for (const effect of effects)
    {
        const shader = effect.shader;
        if (!shader || !effect.IsGood()) continue;
        const signature = JSON.stringify([ planet.heightMap1, planet.heightMap2, planet.itemID, planet.heightMapResolution ]);
        let state = bindings.get(effect);
        if (state && (state.shader !== shader || state.signature !== signature))
        {
            if (state.target) state.target.Destroy();
            bindings.delete(effect);
            state = null;
        }
        if (state && state.done) continue;

        const textures = {};
        if (planet.heightMap1 && shader.HasTexture("NormalHeight1")) textures.NormalHeight1 = planet.heightMap1;
        if (planet.heightMap2 && shader.HasTexture("NormalHeight2")) textures.NormalHeight2 = planet.heightMap2;
        if (Object.keys(textures).length)
        {
            effect.SetTextures(textures, true);
            if (shader.HasConstant("Random")) effect.SetParameters({ Random: planet.itemID % 100 }, true);
            // These parameters were absent when the template's shader loaded.
            // SetTextures/SetParameters update the parameter map but do not
            // rebuild stage bindings when the effect resource is unchanged.
            effect.BindParameters();
            bindings.set(effect, { shader, signature, done: true });
            bound++;
            continue;
        }

        // Only the legacy surface family has a corresponding blit program.
        // In particular, never replace an authored gas HeightMap without inputs.
        const match = effect.effectFilePath.match(/^(.*\/planet\/)(earthlikeplanet|gasgiant|iceplanet|lavaplanet|oceanplanet|sandstormplanet|simplemoon|thunderstormplanet)(\.sm_\w+)$/i);
        if (!shader.HasTexture("HeightMap") || !match || (!planet.heightMap1 && !planet.heightMap2)) continue;
        if (!state)
        {
            const maxHeight = Math.floor(device.gl.getParameter(device.gl.MAX_TEXTURE_SIZE) / 2);
            const height = Math.min(maxHeight, Math.max(1, Math.floor(planet.heightMapResolution || 2048)));
            const parameters = { ...effect.GetParameters(), Random: planet.itemID % 100, TargetTextureHeight: height };
            const inputs = { ...effect.GetTextures() };
            // The output must not be sampled by the bake itself.
            delete inputs.HeightMap;
            if (planet.heightMap1) inputs.NormalHeight1 = planet.heightMap1;
            if (planet.heightMap2) inputs.NormalHeight2 = planet.heightMap2;
            state = {
                shader, signature, height, done: false,
                bake: Tw2Effect.from({
                    effectFilePath: `${match[1].replace(/\/effect(?:\.\w+)?\//i, "/effect.gles2/")}${match[2]}blitheight${match[3]}`,
                    parameters, textures: inputs
                }),
                target: new Tw2RenderTarget()
            };
            bindings.set(effect, state);
        }

        // A legacy texture's IsGood means bytes loaded, not GPU upload done.
        // Unlike a surface draw, a one-shot bake cannot recover next frame.
        // EveOldPlanet waited through tw2.Watch; require the same prepared state.
        if (!state.bake.IsGood() || state.bake.GetResources().some(resource =>
            resource.HasPrepared ? !resource.HasPrepared() : !resource.IsGood())) continue;
        const { gl } = device;
        const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        const viewport = gl.getParameter(gl.VIEWPORT);
        const clearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
        const colorMask = gl.getParameter(gl.COLOR_WRITEMASK);
        const scissor = gl.isEnabled(gl.SCISSOR_TEST);
        let rendered = false;
        try
        {
            if (!state.target.IsGood()) state.target.Create(state.height * 2, state.height, false);
            if (!state.target.IsGood()) continue;
            state.target.Set();
            device.SetStandardStates(device.RM_FULLSCREEN);
            gl.disable(gl.SCISSOR_TEST);
            gl.colorMask(true, true, true, true);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            rendered = state.bake.GetPassCount("Main") > 0 && device.RenderFullScreenQuad(state.bake, "Main");
        }
        finally
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.viewport(...viewport);
            gl.clearColor(...clearColor);
            gl.colorMask(...colorMask);
            if (scissor) gl.enable(gl.SCISSOR_TEST);
            else gl.disable(gl.SCISSOR_TEST);
            device.InvalidateStandardStates();
        }
        if (!rendered) continue;
        effect.SetTextures({ HeightMap: "" });
        effect.parameters.HeightMap.AttachTextureRes(state.target.texture);
        effect.BindParameters();
        state.done = true;
        bound++;
    }
    return bound;
}
