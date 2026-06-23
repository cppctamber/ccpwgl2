export const Pos = [
    { usage: "POSITION", usageIndex: 0, elements: 3 }
];


export const DefAmbientOcclusion = { usage: "TEXCOORD", usageIndex: 20, elements: 1 };

export const PosTexTanTexL01 = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
    { usage: "TANGENT", usageIndex: 0, elements: 4 },
    { usage: "TEXCOORD", usageIndex: 1, elements: 2 },
    DefAmbientOcclusion
];

export const PosBwtTexTanTexL01 = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "BLENDWEIGHT", usageIndex: 0, elements: 4 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
    { usage: "TANGENT", usageIndex: 0, elements: 4 },
    { usage: "TEXCOORD", usageIndex: 1, elements: 2 },
    DefAmbientOcclusion
];

export const PosTexTanColTexL01 = [
    { usage: "POSITION", usageIndex: 0 },
    { usage: "TEXCOORD", usageIndex: 0 },
    { usage: "TANGENT", usageIndex: 0 },
    { usage: "COLOR", usageIndex: 0 },
    { usage: "TEXCOORD", usageIndex: 1 },
    DefAmbientOcclusion
];

export const PosTexTanL01 = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
    { usage: "TANGENT", usageIndex: 0, elements: 4 },
    DefAmbientOcclusion
];



export const PosTexTanTex = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
    { usage: "TANGENT", usageIndex: 0, elements: 4 },
    { usage: "TEXCOORD", usageIndex: 1, elements: 2 }
];

export const PosBwtTan = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "BLENDWEIGHT", usageIndex: 0, elements: 4 },
    { usage: "TANGENT", usageIndex: 0, elements: 4 },
];

export const PosTexTan = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
    { usage: "TANGENT", usageIndex: 0, elements: 4 }
];

export const PosTexNor = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
    { usage: "NORMAL", usageIndex: 0, elements: 3 }
];

export const PosTex = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
];

export const PosBwtTexL01 = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "BLENDWEIGHT", usageIndex: 0, elements: 4 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
    DefAmbientOcclusion
];

export const PosBwtTex = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "BLENDWEIGHT", usageIndex: 0, elements: 4 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
];

export const PosBwtTexTanTex = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "BLENDWEIGHT", usageIndex: 0, elements: 4 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
    { usage: "TANGENT", usageIndex: 0, elements: 4 },
    { usage: "TEXCOORD", usageIndex: 1, elements: 2 },
];

export const PosTexNorTanBinTex = [
    { usage: "POSITION", usageIndex: 0, elements: 3 },
    { usage: "TEXCOORD", usageIndex: 0, elements: 2 },
    { usage: "NORMAL", usageIndex: 0, elements: 3 },
    { usage: "TANGENT", usageIndex: 0, elements: 4 },
    { usage: "BINORMAL", usageIndex: 0, elements: 4 },
    { usage: "TEXCOORD", usageIndex: 1, elements: 2 }
];