import { skinnedQuadHeatV5, quadHeatV5 } from "./quadheatv5";


// Todo: Create a quad heat detail shader

export const quadHeatDetailV5 = Object.assign({}, quadHeatV5, {
    name: "quadHeatDetailV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/quadHeatDetailV5",
});

export const skinnedQuadHeatDetailV5 = Object.assign({}, skinnedQuadHeatV5, {
    name: "skinned_quadHeatDetailV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/quad/skinned_quadHeatDetailV5"
});