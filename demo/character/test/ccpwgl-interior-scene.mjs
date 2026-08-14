export class Tr2InteriorScene
{
    constructor()
    {
        this.dynamics = [];
        this.lights = [];
        this.initialized = 0;
        this.updated = [];
        this.viewDependentUpdates = 0;
        this.batchModes = [];
    }

    Initialize()
    {
        this.initialized++;
    }

    Update(dt)
    {
        this.updated.push(dt);
    }

    UpdateViewDependentData()
    {
        this.viewDependentUpdates++;
    }

    GetBatches(mode, accumulator)
    {
        this.batchModes.push(mode);
        if (this.dynamics.length) accumulator.length++;
        return Boolean(this.dynamics.length);
    }

    GetResources(out = [])
    {
        for (const item of [ ...this.dynamics, ...this.lights ])
        {
            item?.GetResources?.(out);
        }
        return out;
    }
}
