import { asteroidV5, skinnedAsteroidV5 } from "./asteroidV5";

// Todo: Find out why these are the same as asteroidV5 - one of them should have Dissolve lines?

export const rockV5 = {
    name: "rockV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/organic/rockV5",
    description: "rock shader",
    techniques: asteroidV5.techniques
};

export const skinnedRockV5 = {
    name: "skinned_rockV5",
    replaces: "graphics/effect.gles2/managed/space/spaceobject/v5/organic/skinned_rockV5",
    description: "skinned rock shader",
    techniques: skinnedAsteroidV5.techniques
};
