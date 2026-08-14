let current = {};

const d3d = {
    RS_ZENABLE: 7,
    RS_ZWRITEENABLE: 14,
    RS_SRCBLEND: 19,
    RS_DESTBLEND: 20,
    RS_CULLMODE: 22,
    RS_ALPHATESTENABLE: 15,
    RS_ALPHAREF: 24,
    RS_ALPHAFUNC: 25,
    RS_ALPHABLENDENABLE: 27,
    RS_COLORWRITEENABLE: 168,
    RS_SEPARATEALPHABLENDENABLE: 206,
    RS_SRCBLENDALPHA: 207,
    RS_DESTBLENDALPHA: 208,
    CULL_NONE: 1,
    BLEND_ONE: 2,
    BLEND_ZERO: 1,
    BLEND_SRCALPHA: 5,
    BLEND_INVSRCALPHA: 6,
    CMP_GREATER: 5
};

export const tw2 = new Proxy({}, {
    get(target, property)
    {
        const value = current[property];
        return typeof value === "function" ? value.bind(current) : value;
    }
});

export function SetTestTw2(value)
{
    const supplied = value ?? {};
    current = {
        ...supplied,
        GetClass(name)
        {
            if (name === "Tw2VertexElement")
            {
                return {
                    Type: {
                        POSITION: 0,
                        NORMAL: 1,
                        TANGENT: 2,
                        BITANGENT: 3,
                        BINORMAL: 3
                    }
                };
            }
            return supplied.GetClass?.(name);
        },
        const: { ...d3d, ...supplied.const },
        resMan: {
            BuildUrl(path) { return path; },
            async FetchRaw(path) { throw new Error(`Unexpected raw resource request: ${path}`); },
            ...supplied.resMan
        }
    };
    return current;
}
