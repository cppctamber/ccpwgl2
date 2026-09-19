import { meta } from "utils";
import { mat3, mat4, quat, vec3 } from "math";

function anchorState(anchors)
{
    const center = [ 0, 0, 0 ], forward = [ 0, 0, 0 ];
    if (!anchors.length) return { center, forward: [ 0, 0, 1 ], radius: 1000 };
    const point = vec3.create(), matrix = mat4.create(), rotation = quat.create(), basis = mat3.create();
    for (const anchor of anchors)
    {
        anchor.GetModelCenterWorldPosition(point);
        for (let i = 0; i < 3; i++) center[i] += point[i];
        // GetWorldTransform is CCPWGL's counterpart of GetLocalToWorldTransform.
        if (anchor.GetLocalToWorldTransform) anchor.GetLocalToWorldTransform(matrix);
        else anchor.GetWorldTransform(matrix);
        mat3.fromMat4(basis, matrix);
        quat.fromMat3(rotation, basis);
        vec3.transformQuat(point, [ 0, 0, 1 ], rotation);
        vec3.normalize(point, point);
        for (let i = 0; i < 3; i++) forward[i] += point[i];
    }
    for (let i = 0; i < 3; i++) { center[i] /= anchors.length; forward[i] /= anchors.length; }
    forward[1] = 0;
    vec3.normalize(forward, forward);
    let radius = 0;
    const sphere = new Float32Array(4);
    for (const anchor of anchors)
    {
        if (anchor.GetBoundingSphere(sphere))
        {
            anchor.GetModelCenterWorldPosition(point);
            radius = Math.max(radius, vec3.distance(point, center) + sphere[3]);
        }
    }
    return { center, forward, radius: radius || 1000 };
}

@meta.define("EveVirtualCamera", true)
export class EveVirtualCamera extends meta.Model
{
    @meta.string name = "Virtual Camera";
    @meta.float animationTimelineLength = 10;
    @meta.list("EveVirtualCameraBehaviourVector3Base") positionBehaviours = [];
    @meta.list("EveVirtualCameraBehaviourVector3Base") pointOfInterestBehaviours = [];
    @meta.list("EveVirtualCameraBehaviourFloatBase") fovBehaviours = [];
    @meta.list("EveVirtualCameraBehaviourFloatBase") rollBehaviours = [];
    positionAnchors = [];
    pointOfInterestAnchors = [];
    running = false;
    fov = 1;
    roll = 0;
    position = vec3.create();
    pointOfInterest = vec3.create();
    localElapsedTime = 0;
    positionAnchorCenter = vec3.create();
    positionAnchorRadius = 0;
    positionAnchorForwardDirection = vec3.create();
    _pointOfInterestAnchorCenter = vec3.create();
    _pointOfInterestAnchorRadius = 0;
    pointOfInterestAnchorForwardDirection = vec3.create();

    // Preserve the two Blue exposure aliases (the actual POI state is separate).
    get pointOfInterestAnchorCenter() { return this.positionAnchorCenter; }
    get pointOfInterestAnchorRadius() { return this.positionAnchorRadius; }
    get forward() { return this.GetViewDirection(); }
    get right() { return this.GetRightDirection(); }
    get up() { return this.GetUpDirection(); }

    GetViewMatrix(out = mat4.create())
    {
        return mat4.lookAt(out, this.position, this.pointOfInterest, this.GetUpDirection());
    }
    GetProjectionMatrix(aspect, front, back, out = mat4.create())
    {
        const y = front * Math.tan(this.fov / 2), x = y * aspect;
        return mat4.carbonPerspectiveOffCenter(out, -x, x, -y, y, front, back);
    }
    GetViewDirection(out = vec3.create())
    {
        return vec3.normalize(out, vec3.subtract(out, this.pointOfInterest, this.position));
    }
    GetForwardDirection(out = vec3.create()) { return this.GetViewDirection(out); }
    GetUpDirection(out = vec3.create())
    {
        const forward = this.GetForwardDirection(), right = vec3.cross(vec3.create(), forward, [ 0, 1, 0 ]);
        vec3.normalize(right, right);
        vec3.normalize(out, vec3.cross(out, right, forward));
        const rotation = quat.setAxisAngle(quat.create(), forward, -this.roll * Math.PI / 180);
        return vec3.normalize(out, vec3.transformQuat(out, out, rotation));
    }
    GetRightDirection(out = vec3.create())
    {
        return vec3.normalize(out, vec3.cross(out, this.GetForwardDirection(), this.GetUpDirection()));
    }

    Update(dt)
    {
        if (!this.running) dt = 0;
        this.localElapsedTime += dt;
        const p = anchorState(this.positionAnchors), i = anchorState(this.pointOfInterestAnchors);
        vec3.copy(this.positionAnchorCenter, p.center);
        vec3.copy(this.positionAnchorForwardDirection, p.forward);
        this.positionAnchorRadius = p.radius;
        vec3.copy(this._pointOfInterestAnchorCenter, i.center);
        vec3.copy(this.pointOfInterestAnchorForwardDirection, i.forward);
        this._pointOfInterestAnchorRadius = i.radius;
        const position = vec3.clone(p.center), interest = vec3.clone(i.center);
        const vectors = (list, value, anchor) =>
        {
            for (const b of list)
            {
                if (b.IsActive()) vec3.add(value, value, b.Update(this, value, dt, this.localElapsedTime, anchor.center, anchor.radius, anchor.forward));
            }
        };
        const scalar = (list, value) =>
        {
            for (const b of list)
            {
                if (b.IsActive()) value += b.Update(this, value, dt, this.localElapsedTime, p.center, p.radius, p.forward);
            }
            return value;
        };
        vectors(this.positionBehaviours, position, p);
        vectors(this.pointOfInterestBehaviours, interest, i);
        const fov = scalar(this.fovBehaviours, 1), roll = scalar(this.rollBehaviours, 0);
        if (this.positionBehaviours.length) vec3.copy(this.position, position);
        if (this.pointOfInterestBehaviours.length) vec3.copy(this.pointOfInterest, interest);
        if (this.fovBehaviours.length) this.fov = fov;
        if (this.rollBehaviours.length) this.roll = roll;
    }

    Play() { this.running = true; }
    Pause() { this.running = false; }
    Reset() { this.localElapsedTime = 0; }
    Stop() { this.Reset(); this.running = false; }
    UpdateToLocalTime(time)
    {
        const diff = time - this.localElapsedTime;
        let dt = 1 / 60, iterations = Math.floor(Math.abs(diff / dt));
        if (iterations > 20) { iterations = 20; dt = diff / 20; }
        iterations--;
        const wasRunning = this.running;
        this.Play();
        for (let j = 0; j < iterations; j++) this.Update(dt);
        this.Update(time - this.localElapsedTime);
        if (!wasRunning) this.Pause();
    }
    CopyTransform(source) { this.UpdateExternal(source.position, source.pointOfInterest, source.fov, source.roll); }
    UpdateExternal(position, pointOfInterest, fov, roll)
    {
        vec3.copy(this.position, position);
        vec3.copy(this.pointOfInterest, pointOfInterest);
        this.fov = fov;
        this.roll = roll;
    }
    GetName() { return this.name; }
    SetName(value) { this.name = value; }
    GetAnimationTimelineLength() { return this.animationTimelineLength; }
    SetAnimationTimelineLength(value) { this.animationTimelineLength = value; }
    GetFov() { return this.fov; }
    SetFov(value) { this.fov = value; }
    GetRoll() { return this.roll; }
    SetRoll(value) { this.roll = value; }
    GetPosition(out = vec3.create()) { return vec3.copy(out, this.position); }
    SetPosition(value) { vec3.copy(this.position, value); }
    GetPointOfInterest(out = vec3.create()) { return vec3.copy(out, this.pointOfInterest); }
    SetPointOfInterest(value) { vec3.copy(this.pointOfInterest, value); }
    AddPositionBehaviour(value) { this.positionBehaviours.push(value); }
    AddPointOfInterestBehaviour(value) { this.pointOfInterestBehaviours.push(value); }
    AddFOVBehaviour(value) { this.fovBehaviours.push(value); }
    AddRollBehaviour(value) { this.rollBehaviours.push(value); }
}
