import { meta } from "utils";
import { device } from "global";


/** Carbon's histogram resolution (CreateHistograms / MeasureExposure: 64 bins). */
const BINS = 64;

/** Carbon's exposure buffer: R32_FLOAT x 8 (`Tr2PostProcessRenderer.cpp:1700-1707`). */
const EXPOSURE_ELEMENTS = 8;


/**
 * Scatters one point per scene pixel into its luminance bin.
 *
 * CreateHistograms, per pixel: sRGB-decode the colour, take Rec.709 luminance,
 * and bin its natural log between ln(minLuminance) and ln(maxLuminance) into 64
 * bins. The decode is Carbon's, applied to a linear HDR source exactly as
 * Carbon applies it to its own.
 */
const HISTOGRAM_VS = `#version 300 es
precision highp float;
precision highp int;
uniform highp sampler2D uSource;
uniform ivec2 uSize;
uniform vec2 uLogLuminance;
void main()
{
    ivec2 pixel = ivec2(gl_VertexID % uSize.x, gl_VertexID / uSize.x);
    vec3 c = texelFetch(uSource, pixel, 0).rgb;
    vec3 lin = mix(pow(abs((c + 0.055) * 0.9478673), vec3(2.4)), c * 0.07739938, lessThan(c, vec3(0.04045)));
    float lum = dot(lin, vec3(0.2125, 0.7154, 0.0721));
    float t = (log(lum) - uLogLuminance.x) / (uLogLuminance.y - uLogLuminance.x);
    // saturate() of NaN is 0 on D3D; GLSL leaves clamp(NaN) undefined.
    t = t >= 0.0 ? min(t, 1.0) : 0.0;
    int bin = min(int(t * 64.0), 63);
    gl_Position = vec4((float(bin) + 0.5) / 32.0 - 1.0, 0.0, 0.0, 1.0);
    gl_PointSize = 1.0;
}`;

const HISTOGRAM_FS = `#version 300 es
precision highp float;
out vec4 color;
void main()
{
    color = vec4(1.0);
}`;

const FULLSCREEN_VS = `#version 300 es
void main()
{
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/**
 * MeasureExposure, one fragment per exposure element.
 *
 * Decoded from the shipped DXBC (effect.dx11 measureexposure.sm_depth):
 * [5]/[6] luminance at the minBrightness/maxBrightness fractions of the pixel
 * count, [3]/[4] the matching bin positions, [0] the adapted value, [1] the
 * time it was adapted at. [2] and [7] are never written.
 */
const MEASURE_FS = `#version 300 es
precision highp float;
precision highp int;
uniform highp sampler2D uHistogram;
uniform highp sampler2D uPrevious;
uniform vec4 uLuminance;   // ln(minLuminance), ln(maxLuminance), minBrightness, maxBrightness
uniform vec4 uAdaptation;  // increaseSpeed, decreaseSpeed, minExposure, maxExposure
uniform float uTime;
out vec4 color;

float bins[64];

// First walk: the bin where the running count reaches c, as a luminance.
float PercentileLuminance(uint c)
{
    if (c == 0u) return 0.0;
    uint remaining = c;
    float pos = 0.0;
    for (int i = 0; i < 64; ++i)
    {
        uint count = uint(bins[i]);
        if (count >= remaining)
        {
            pos = (float(i) + float(remaining) / float(count)) * 0.015625;
            break;
        }
        remaining -= count;
    }
    return exp(mix(uLuminance.x, uLuminance.y, pos));
}

// Second walk: the same count as a bin position, strictly below; 0 if unfound.
float PercentilePosition(uint c)
{
    uint remaining = c;
    for (int i = 0; i < 64; ++i)
    {
        uint count = uint(bins[i]);
        if (remaining < count) return float(i) + float(remaining) / float(count);
        remaining -= count;
    }
    return 0.0;
}

void main()
{
    int element = int(gl_FragCoord.x);
    float previous = texelFetch(uPrevious, ivec2(element, 0), 0).x;

    uint total = 0u;
    for (int i = 0; i < 64; ++i)
    {
        bins[i] = texelFetch(uHistogram, ivec2(i, 0), 0).x;
        total += uint(bins[i]);
    }
    uint low = uint(float(total) * uLuminance.z);
    uint high = uint(float(total) * uLuminance.w);

    float lumLow = PercentileLuminance(low);
    float lumHigh = PercentileLuminance(high);

    float value = previous;
    if (element == 3) value = PercentilePosition(low);
    else if (element == 4) value = PercentilePosition(high);
    else if (element == 5) value = lumLow;
    else if (element == 6) value = lumHigh;
    else if (element == 1) value = uTime;
    else if (element == 0)
    {
        float average = mix(lumLow, lumHigh, 0.5);
        float scale = average < 0.0001 ? 5000.0 : 0.5 / average;
        scale = max(min(scale, exp2(uAdaptation.w)), exp2(uAdaptation.z));
        float target = 0.5 / scale;
        float speed = previous < target ? uAdaptation.x : uAdaptation.y;
        float lastTime = texelFetch(uPrevious, ivec2(1, 0), 0).x;
        float k = max(1.0 - exp(-speed * (uTime - lastTime)), 0.0);
        float adapted = mix(sqrt(previous), sqrt(target), k);
        value = adapted * adapted;
    }
    color = vec4(value);
}`;


/**
 * Carbon's dynamic exposure (`Tr2PostProcessRenderer::RenderDynamicExposure`,
 * `Tr2PostProcessRenderer.cpp:1182-1241`) on WebGL2.
 *
 * Carbon runs three compute passes: CreateHistograms (per-tile 64-bin
 * histograms with shared-memory atomics), MergeHistograms, and MeasureExposure
 * (one thread). The result is an 8-float exposure buffer that persists across
 * frames and that the tonemap reads as `Exposure`.
 *
 * diverged: WebGL2 has neither compute nor atomics. The histogram is built by
 * scattering one point per scene pixel into a 64x1 float target with additive
 * blending - the same per-pixel binning and the same counts, without tiles - and
 * MeasureExposure runs as a fragment pass over an 8x1 target, ping-ponged so the
 * previous frame's buffer can be read. Float blending needs EXT_float_blend: a
 * half-float target cannot count past 2048, so without it this does not run and
 * the composite keeps fixed exposure.
 *
 * The buffer is published under its Carbon name, `Exposure`, through the Carbon
 * binder's named buffer sources, as `FlareOcclusionBuffer` is.
 */
@meta.define("Tw2DynamicExposureRenderer")
export class Tw2DynamicExposureRenderer
{

    _histogramProgram = null;
    _measureProgram = null;
    _vao = null;
    _histogram = null;
    _exposure = [ null, null ];
    _current = 0;
    _status = "not_run";

    /**
     * Gets the exposure buffer texture the tonemap should read, or null
     * @param {WebGL2RenderingContext} gl
     * @param {String|null} format - the binding's format
     * @returns {WebGLTexture|null}
     */
    GetExposureTexture(gl, format)
    {
        // RGBA32F and R32F both read `.x` through a float sampler; an R32UI
        // binding would need a usampler, which Carbon never declares here.
        if (format === "R32UI") return null;
        const target = this._exposure[this._current];
        return target ? target.texture : null;
    }

    /**
     * Gets why the last frame did or did not measure
     * @returns {String}
     */
    GetStatus()
    {
        return this._status;
    }

    /**
     * Measures the scene image and adapts the exposure buffer
     * @param {Tr2PPDynamicExposureEffect} effect
     * @param {Tw2RenderTarget} sceneTarget
     * @returns {Boolean} true if the buffer was updated
     */
    Render(effect, sceneTarget)
    {
        const { gl } = device;

        if (!device.canRenderToFloat || !gl.getExtension("EXT_float_blend"))
        {
            this._status = "no_float_blend";
            return false;
        }

        if (!sceneTarget || !sceneTarget.texture || !sceneTarget.texture.texture)
        {
            this._status = "no_source";
            return false;
        }

        this._EnsureResources(gl);

        const
            width = sceneTarget.width,
            height = sceneTarget.height,
            prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING),
            prevViewport = gl.getParameter(gl.VIEWPORT),
            prevVao = gl.getParameter(gl.VERTEX_ARRAY_BINDING),
            prevProgram = gl.getParameter(gl.CURRENT_PROGRAM),
            prevActive = gl.getParameter(gl.ACTIVE_TEXTURE);

        gl.bindVertexArray(this._vao);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.SCISSOR_TEST);
        gl.colorMask(true, true, true, true);

        // CreateHistograms + MergeHistograms: cleared every frame, as Carbon's
        // ClearUav does, then one additive point per pixel.
        const h = this._histogramProgram;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._histogram.fbo);
        gl.viewport(0, 0, BINS, 1);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(h.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sceneTarget.texture.texture);
        gl.uniform1i(h.source, 0);
        gl.uniform2i(h.size, width, height);
        gl.uniform2f(h.logLuminance, Math.log(effect.minLuminance), Math.log(effect.maxLuminance));
        gl.drawArrays(gl.POINTS, 0, width * height);
        gl.disable(gl.BLEND);

        // MeasureExposure into the other buffer, reading the previous one.
        const
            m = this._measureProgram,
            previous = this._exposure[this._current],
            next = this._exposure[1 - this._current];

        gl.bindFramebuffer(gl.FRAMEBUFFER, next.fbo);
        gl.viewport(0, 0, EXPOSURE_ELEMENTS, 1);
        gl.useProgram(m.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._histogram.texture);
        gl.uniform1i(m.histogram, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, previous.texture);
        gl.uniform1i(m.previous, 1);
        gl.uniform4f(m.luminance, Math.log(effect.minLuminance), Math.log(effect.maxLuminance), effect.minBrightness, effect.maxBrightness);
        gl.uniform4f(m.adaptation, effect.increaseSpeed, effect.decreaseSpeed, effect.minExposure, effect.maxExposure);
        gl.uniform1f(m.time, device.currentTime);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        this._current = 1 - this._current;

        gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
        gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);
        gl.bindVertexArray(prevVao);
        gl.useProgram(prevProgram);
        gl.activeTexture(prevActive);
        gl.enable(gl.DEPTH_TEST);
        device.InvalidateStandardStates();

        this._status = "measured";
        return true;
    }

    /**
     * Reads the exposure buffer back. Stalls the pipeline; debug only.
     * @returns {Float32Array|null} the 8 elements
     */
    Read()
    {
        const target = this._exposure[this._current];
        if (!target) return null;
        const { gl } = device;
        const prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        const pixels = new Float32Array(EXPOSURE_ELEMENTS * 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        gl.readPixels(0, 0, EXPOSURE_ELEMENTS, 1, gl.RGBA, gl.FLOAT, pixels);
        gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
        const out = new Float32Array(EXPOSURE_ELEMENTS);
        for (let i = 0; i < EXPOSURE_ELEMENTS; i++) out[i] = pixels[i * 4];
        return out;
    }

    /**
     * Compiles the programs and allocates the targets on first use
     * @param {WebGL2RenderingContext} gl
     * @private
     */
    _EnsureResources(gl)
    {
        if (this._histogramProgram) return;

        const h = Tw2DynamicExposureRenderer.CompileProgram(gl, HISTOGRAM_VS, HISTOGRAM_FS, "histogram");
        this._histogramProgram = {
            program: h,
            source: gl.getUniformLocation(h, "uSource"),
            size: gl.getUniformLocation(h, "uSize"),
            logLuminance: gl.getUniformLocation(h, "uLogLuminance")
        };

        const m = Tw2DynamicExposureRenderer.CompileProgram(gl, FULLSCREEN_VS, MEASURE_FS, "measure");
        this._measureProgram = {
            program: m,
            histogram: gl.getUniformLocation(m, "uHistogram"),
            previous: gl.getUniformLocation(m, "uPrevious"),
            luminance: gl.getUniformLocation(m, "uLuminance"),
            adaptation: gl.getUniformLocation(m, "uAdaptation"),
            time: gl.getUniformLocation(m, "uTime")
        };

        this._vao = gl.createVertexArray();

        // Carbon's exposure buffer starts at zero, so the first measure sees a
        // last time of 0 and snaps straight to its target.
        this._histogram = Tw2DynamicExposureRenderer.CreateTarget(gl, BINS, gl.R32F, gl.RED);
        this._exposure = [
            Tw2DynamicExposureRenderer.CreateTarget(gl, EXPOSURE_ELEMENTS, gl.RGBA32F, gl.RGBA),
            Tw2DynamicExposureRenderer.CreateTarget(gl, EXPOSURE_ELEMENTS, gl.RGBA32F, gl.RGBA)
        ];
    }

    /**
     * Creates a width x 1 float target, zeroed
     * @param {WebGL2RenderingContext} gl
     * @param {Number} width
     * @param {Number} internalFormat
     * @param {Number} format
     * @returns {{texture: WebGLTexture, fbo: WebGLFramebuffer}}
     */
    static CreateTarget(gl, width, internalFormat, format)
    {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const channels = format === gl.RGBA ? 4 : 1;
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, 1, 0, format, gl.FLOAT, new Float32Array(width * channels));
        gl.bindTexture(gl.TEXTURE_2D, null);

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return { texture, fbo };
    }

    /**
     * Compiles and links a program, throwing with the log on failure
     * @param {WebGL2RenderingContext} gl
     * @param {String} vs
     * @param {String} fs
     * @param {String} label
     * @returns {WebGLProgram}
     */
    static CompileProgram(gl, vs, fs, label)
    {
        const compile = (type, src) =>
        {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            {
                throw new Error(`Dynamic exposure ${label} compile: ${gl.getShaderInfoLog(shader)}`);
            }
            return shader;
        };

        const program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vs));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            throw new Error(`Dynamic exposure ${label} link: ${gl.getProgramInfoLog(program)}`);
        }
        return program;
    }

}
