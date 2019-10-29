import { set, create } from "./meta";

function createStage(stage)
{
    return create(false, {

        class({ target })
        {
            set("stage", stage, target);
            target.__isStaging = stage;
        }

    });
}

// Partial implementation, won't throw errors
export const stage1 = createStage(1);

// Partial implementation, likely to throw errors
export const stage2 = createStage(2);

// Not implemented, will throw errors if used
export const stage3 = createStage(3);


