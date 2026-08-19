/* global globalThis */

const TRANSPARENT_ALPHA = 8;
const OPAQUE_ALPHA = 247;

/**
 * Adds an opt-in DOM telemetry seam for automated canvas-alpha audits.
 *
 * The normal character demo never installs this hook. It exists so browser
 * automation can distinguish genuine HTML-through-canvas holes from an
 * unfortunate scene colour without reaching into renderer internals.
 */
export function installCharacterDemoAlphaAudit({ application, tw2 } = {})
{
    if (!application || typeof application.SelectPaperdoll !== "function")
    {
        throw new TypeError("Character alpha audit requires the demo application");
    }
    const gl = tw2?.device?.gl;
    if (!gl || typeof gl.readPixels !== "function")
    {
        throw new TypeError("Character alpha audit requires a readable WebGL context");
    }

    const output = document.createElement("output");
    output.id = "character-alpha-audit";
    output.hidden = true;
    document.body.append(output);

    const read = async () =>
    {
        await NextRenderedFrame();
        const report = ReadAlphaReport(gl);
        output.textContent = JSON.stringify(report);
        output.dataset.revision = String(Number(output.dataset.revision ?? 0) + 1);
        return report;
    };
    const selectPaperdoll = application.SelectPaperdoll.bind(application);
    application.SelectPaperdoll = async (...args) =>
    {
        const result = await selectPaperdoll(...args);
        await read();
        return result;
    };
    void read();
    return { output, read };
}

function ReadAlphaReport(gl)
{
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const bounds = gl.canvas?.getBoundingClientRect?.() ?? null;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    const transparent = new Uint8Array(width * height);
    let transparentPixels = 0;
    let partialPixels = 0;
    let opaquePixels = 0;
    let magentaPixels = 0;
    let alphaHash = 0x811c9dc5;
    for (let pixel = 0, index = 0; pixel < transparent.length; pixel++, index += 4)
    {
        const alpha = pixels[index + 3];
        alphaHash ^= alpha;
        alphaHash = Math.imul(alphaHash, 0x01000193) >>> 0;
        if (alpha <= TRANSPARENT_ALPHA)
        {
            transparent[pixel] = 1;
            transparentPixels++;
        }
        else if (alpha >= OPAQUE_ALPHA) opaquePixels++;
        else partialPixels++;
        // Compatibility proof materials are shaded by the scene, so their
        // framebuffer values are darker than the literal (1, 0, 1) source.
        // Keep the test deliberately chroma-shaped rather than exact-RGB.
        if (pixels[index] >= 128
            && pixels[index + 1] <= 96
            && pixels[index + 2] >= 128
            && pixels[index] >= pixels[index + 1] * 1.75
            && pixels[index + 2] >= pixels[index + 1] * 1.75
            && alpha >= OPAQUE_ALPHA)
        {
            magentaPixels++;
        }
    }

    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let queueRead = 0;
    let queueWrite = 0;
    const enqueue = pixel =>
    {
        if (!transparent[pixel] || visited[pixel]) return;
        visited[pixel] = 1;
        queue[queueWrite++] = pixel;
    };
    for (let x = 0; x < width; x++)
    {
        enqueue(x);
        enqueue((height - 1) * width + x);
    }
    for (let y = 1; y < height - 1; y++)
    {
        enqueue(y * width);
        enqueue(y * width + width - 1);
    }
    while (queueRead < queueWrite)
    {
        const pixel = queue[queueRead++];
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        if (x) enqueue(pixel - 1);
        if (x + 1 < width) enqueue(pixel + 1);
        if (y) enqueue(pixel - width);
        if (y + 1 < height) enqueue(pixel + width);
    }

    let enclosedComponentCount = 0;
    let enclosedTransparentPixels = 0;
    let largestEnclosedComponent = 0;
    for (let start = 0; start < transparent.length; start++)
    {
        if (!transparent[start] || visited[start]) continue;
        queueRead = 0;
        queueWrite = 0;
        visited[start] = 1;
        queue[queueWrite++] = start;
        let size = 0;
        while (queueRead < queueWrite)
        {
            const pixel = queue[queueRead++];
            size++;
            const x = pixel % width;
            const y = Math.floor(pixel / width);
            if (x) enqueue(pixel - 1);
            if (x + 1 < width) enqueue(pixel + 1);
            if (y) enqueue(pixel - width);
            if (y + 1 < height) enqueue(pixel + width);
        }
        if (size < 4) continue;
        enclosedComponentCount++;
        enclosedTransparentPixels += size;
        largestEnclosedComponent = Math.max(largestEnclosedComponent, size);
    }

    return {
        width,
        height,
        cssWidth: bounds?.width ?? null,
        cssHeight: bounds?.height ?? null,
        devicePixelRatio: Number(globalThis.devicePixelRatio ?? 1),
        transparentAlphaThreshold: TRANSPARENT_ALPHA,
        opaqueAlphaThreshold: OPAQUE_ALPHA,
        transparentPixels,
        partialPixels,
        opaquePixels,
        enclosedComponentCount,
        enclosedTransparentPixels,
        largestEnclosedComponent,
        magentaPixels,
        alphaHash: alphaHash.toString(16).padStart(8, "0")
    };
}

function NextRenderedFrame()
{
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
