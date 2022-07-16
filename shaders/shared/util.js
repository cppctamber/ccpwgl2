import {
    FilterMode,
    MipFilterMode,
    TEX_2D,
    TEX_CUBE_MAP,
    TEX_PROJECTION,
    TEX_VOLUME,
    WrapMode
} from "../../src/global/constant";

export { TEX_2D, TEX_CUBE_MAP, TEX_PROJECTION, TEX_VOLUME, WrapMode };


export const WidgetType = {
    LINEAR_COLOR: "LINEARCOLOR",
    MIXED: "MIXEDVECTOR",
    TEXTURE: "TEXTURE"
};


const DEFAULT_TEX_UI = {
    group: "Textures",
    display: 1,
    widget: WidgetType.TEXTURE
};


const DEFAULT_SAMPLER = {
    addressUMode: WrapMode.REPEAT,
    addressVMode: WrapMode.REPEAT,
    addressWMode: WrapMode.REPEAT,
    filterMode: FilterMode.LINEAR,
    mipFilterMode: MipFilterMode.LINEAR,
    maxAnisotropy: 4
};


const DEFAULT_TEX_2D = {
    type: TEX_2D,
    isSRGB: 0,
    isAutoregister: 0,
    isVolume: 0,
    sampler: DEFAULT_SAMPLER
};


const DEFAULT_TEX_CUBE_MAP = {
    type: TEX_CUBE_MAP,
    isSRGB: 0,
    isAutoregister: 0,
    isVolume: 0,
    sampler: DEFAULT_SAMPLER
};


const DEFAULT_TEX_VOLUME = {
    type: TEX_VOLUME,
    isSRGB: 0,
    isAutoregister: 0,
    isVolume: 0,
    sampler: DEFAULT_SAMPLER
};


const DEFAULT_TEX_PROJECTION = {
    type: TEX_PROJECTION,
    isSRGB: 0,
    isAutoregister: 0,
    isVolume: 1,
    sampler: {
        addressUMode: WrapMode.CLAMP_TO_EDGE,
        addressVMode: WrapMode.CLAMP_TO_EDGE,
        addressWMode: WrapMode.CLAMP_TO_EDGE,
        filterMode: FilterMode.LINEAR,
        mipFilterMode: MipFilterMode.NONE,
        maxAnisotropy: 4
    }
};


/**
 * Helper for creating textures and samplers
 * @param {String} name
 * @param {Number} type
 * @param {Object} [options={}]
 * @returns {Object}
 */
export function createTex(name, type, options = {})
{
    let defaults;

    switch (type)
    {
        case TEX_CUBE_MAP:
            defaults = DEFAULT_TEX_CUBE_MAP;
            break;

        case TEX_PROJECTION:
            defaults = DEFAULT_TEX_PROJECTION;
            break;

        case TEX_VOLUME:
            defaults = DEFAULT_TEX_VOLUME;
            break;

        default:
            defaults = DEFAULT_TEX_2D;
            break;
    }

    const
        { sampler = {}, ui = {}, ...texture } = options,
        data = Object.assign({ name }, defaults, texture);

    data.isSRGB = data.isSRGB ? 1 : 0;
    data.isAutoregister = data.isAutoregister ? 1 : 0;
    data.sampler = Object.assign({ name: `${name}Sampler` }, defaults.sampler, sampler);
    data.ui = Object.assign({}, DEFAULT_TEX_UI, ui);

    if (data.isSRGB && !data.ui.components)
    {
        data.ui.components = [ "red", "green", "blue", "alpha" ];
    }

    return data;
}


/**
 * Helper for creating border and wrap versions of a texture
 * @param {String} name
 * @param {Number} type
 * @param {Object} options
 * @returns {*[]}
 */
export function createBorderAndWrap(name, type, options)
{
    const root = createTex(name, type, options);

    return [
        overrideTex(root, {
            sampler: {
                name: `${name}BorderSampler`,
                addressUMode: WrapMode.CLAMP_TO_EDGE,
                addressVMode: WrapMode.CLAMP_TO_EDGE
            }
        }),
        overrideTex(root, {
            sampler : {
                name: `${name}WrapSampler`,
                addressUMode: WrapMode.REPEAT,
                addressVMode: WrapMode.REPEAT
            }
        })
    ];
}


/**
 * Helper for overriding and existing texture
 * @param {Object} src
 * @param {Object} override
 * @returns {*}
 */
export function overrideTex(src, override={})
{
    const out = Object.assign({}, src, override);
    if (override.ui) out.ui = Object.assign({}, src.ui, override.ui);
    if (override.sampler) out.sampler = Object.assign({}, src.sampler, override.sampler);
    return out;
}


/**
 * Creates a linear colour constant definition
 * @param {Object} [options={}]
 * @returns {Object}
 */
export function createLinearColor(options = {})
{
    const
        { ui = {}, ...constant } = options,
        data = Object.assign({ value: [ 1, 1, 1, 1 ] }, constant);

    data.ui = Object.assign({
        group: "None",
        widget: WidgetType.LINEAR_COLOR,
        components: [ "linear red", "linear green", "linear blue", "linear alpha" ],
        description: "Linear colour",
        display: 1
    }, ui);

    return data;
}


/**
 * Creates a gloss constant definition
 * @param {Object} [options={}]
 * @returns {Object}
 */
export function createGloss(options = {})
{
    const
        { ui = {}, ...constant } = options,
        data = Object.assign({ value: [ 0.4000000059604645, 1, 1, 1 ] }, constant);

    data.ui = Object.assign({
        group: "None",
        widget: WidgetType.MIXED,
        components: [ "gloss" ],
        description: "Gloss",
        display: 1
    }, ui);

    return data;
}