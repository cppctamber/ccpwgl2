const assert = require("node:assert/strict");
const path = require("node:path");
const { transformFileSync } = require("@babel/core");


class FakeResource
{
    constructor()
    {
        this.path = "";
        this.prepared = false;
        this.error = null;
    }

    OnPrepared()
    {
        this.prepared = true;
    }

    OnError(error)
    {
        this.error = error;
    }

    OnUnloaded()
    {
        this.prepared = false;
    }
}

const requests = [];
const resMan = {
    async FetchResource(resourcePath)
    {
        requests.push(resourcePath);
        return { path: resourcePath };
    }
};
const GsfReader = {
    extension: "gsf",
    requestResponseType: "arraybuffer",
    Prepare(data, resource)
    {
        if (!data?.stateMachine) throw new TypeError("Expected GSF stateMachine");
        resource.gsf = data;
        resource.format = "gsf";
        resource.stateMachine = data.stateMachine;
        resource.animationSlots = data.animationSlots || [];
        resource.animationSets = data.animationSets || [];
    }
};
const decorator = () => value => value;
const meta = {
    type: decorator,
    define: decorator
};
const sourcePath = path.resolve(__dirname, "../src/core/resource/Tr2GrannyStateRes.js");
const transformed = transformFileSync(sourcePath, {
    configFile: path.resolve(__dirname, "../.babelrc")
}).code;
const moduleValue = { exports: {} };
const localRequire = request =>
{
    if (request === "global") return { resMan };
    if (request === "utils") return { meta };
    if (request === "../reader") return { GsfReader };
    if (request === "./Tw2Resource") return { Tw2Resource: FakeResource };
    return require(request);
};

new Function("require", "module", "exports", transformed)(
    localRequire,
    moduleValue,
    moduleValue.exports
);

const { Tr2GrannyStateRes } = moduleValue.exports;
const resource = new Tr2GrannyStateRes();
resource.path = "res:/animation_gstate/gstate/character.gsf";
resource.Prepare({
    stateMachine: { name: "character" },
    animationSlots: [ { name: "base" } ],
    animationSets: [
        { sourceFileReferences: [ "../female/idle.gr2", "../female/walk.gr2" ] },
        { sourceFileReferences: [ "../female/idle.gr2" ] }
    ]
});

assert.equal(resource.prepared, true, "GSF prepares independently from its referenced clips");
assert.deepEqual(resource.GetGStateAnimFileRefPaths(), [
    "res:/animation_gstate/female/idle.gr2",
    "res:/animation_gstate/female/walk.gr2"
]);
assert.equal(resource.IsFullyLoaded(), false, "referenced clips load asynchronously");

resource.WaitForAnimationResources().then(() =>
{
    assert.equal(resource.IsFullyLoaded(), true);
    assert.deepEqual(requests, resource.GetGStateAnimFileRefPaths());
    assert.deepEqual(
        resource.GetAnimationResource("res:/animation_gstate/female/idle.gr2"),
        { path: "res:/animation_gstate/female/idle.gr2" }
    );
    assert.equal(
        Tr2GrannyStateRes.ResolveAnimPath("..oddname.gr2", resource.path),
        "res:/animation_gstate/gstate/..oddname.gr2"
    );
    console.log("Granny state resource verified");
}).catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
