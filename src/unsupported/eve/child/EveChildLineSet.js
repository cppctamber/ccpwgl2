import { meta } from "utils";
import { EveChild } from "eve/child";
import { mat4, vec3, vec4, quat } from "math";


@meta.notImplemented
@meta.type("EveChildLineSet")
@meta.define({
    wgl: "EveChildLineSet",
    ccp: true
})
export class EveChildLineSet extends EveChild
{

    @meta.string
    name = "";

    @meta.boolean
    additiveBatches = false;

    @meta.boolean
    alwaysOn = false;

    @meta.vector4
    animColor = vec4.fromValues(0, 0, 0, 1);

    @meta.vector4
    baseColor = vec4.fromValues(1, 1, 1, 1);

    @meta.float
    brightness = 1;

    @meta.float
    currentScreenSize = 1;

    @meta.boolean
    display = true;

    @meta.list()
    lines = [];

    @meta.struct()
    lineSet = null;

    @meta.struct("Tw2Mesh", "Tr2Mesh")
    mesh = null;

    @meta.float
    minScreenSize = -1;

    @meta.uint
    renderType = 1;

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.float
    scrollSpeed = 0;

    @meta.vector3
    translation = vec3.create();

    Initialize()
    {
        return true;
    }

    InitializeLineSet()
    {
        return true;
    }

    GenerateManagedPoints()
    {
        return undefined;
    }

    OnPrepareResources()
    {
        return true;
    }

    OnModified()
    {
        return true;
    }

    HasTransparentBatches()
    {
        return false;
    }

    CreateSpriteVertexDeclaration()
    {
        return undefined;
    }

    GetName()
    {
        return this.name;
    }

    SetName(name)
    {
        this.name = name || "";
    }

    IsAlwaysOn()
    {
        return this.alwaysOn;
    }

    IsUpdating()
    {
        return false;
    }

    GetMesh()
    {
        return this.mesh;
    }

    GetOwnerMaxSpeed()
    {
        return 0;
    }

    GetVertexElementAddedThroughCode()
    {
        return [];
    }

    UpdateBoundingSphere()
    {
        return undefined;
    }

    SetShaderOption()
    {
        return undefined;
    }

    UpdateSyncronous()
    {
        return undefined;
    }

    UpdateAsyncronous()
    {
        return undefined;
    }

    UpdateVisibility()
    {
        return undefined;
    }

    AddQuadsToQuadRenderer()
    {
        return undefined;
    }

    Setup(scale, rotation, translation)
    {
        if (scale) vec3.copy(this.scaling, scale);
        if (rotation) quat.copy(this.rotation, rotation);
        if (translation) vec3.copy(this.translation, translation);
    }

    RenderDebugInfo()
    {
        return undefined;
    }

    GetPerObjectData()
    {
        return null;
    }

    GetBatches()
    {
        return false;
    }

    GetLocalToWorldTransform(out = mat4.create())
    {
        return mat4.fromRotationTranslationScale(out, this.rotation, this.translation, this.scaling);
    }

    GetRenderables(out = [])
    {
        return out;
    }

    GetDebugOptions()
    {
        return undefined;
    }

    ChangeLOD()
    {
        return undefined;
    }

    RegisterWithQuadRenderer()
    {
        return undefined;
    }

    UpdateBuffer()
    {
        return undefined;
    }

    ReleaseResources()
    {
        return undefined;
    }

    GetWorldVelocity(out = vec3.create())
    {
        return vec3.set(out, 0, 0, 0);
    }

    GetBoundingSphere(out = vec4.create())
    {
        return vec4.set(out, 0, 0, 0, -1);
    }

    GetSortValue()
    {
        return 0;
    }

}
