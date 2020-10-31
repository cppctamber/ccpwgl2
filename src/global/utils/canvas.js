/**
 *
 * @author css=tricks.com
 * @param text
 * @param parameters
 * @return {HTMLCanvasElement}
 */
export function createTextCanvas(text, parameters = {})
{

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Prepare the font to be able to measure
    let fontSize = parameters.fontSize || 56;
    ctx.font = `${fontSize}px monospace`;

    const textMetrics = ctx.measureText(text);

    let width = textMetrics.width;
    let height = fontSize;

    // Resize canvas to match text size
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    // Re-apply font since canvas is resized.
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = parameters.align || "center";
    ctx.textBaseline = parameters.baseline || "middle";

    // Make the canvas transparent for simplicity
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = parameters.color || "white";
    ctx.fillText(text, width / 2, height / 2);

    return canvas;
}

