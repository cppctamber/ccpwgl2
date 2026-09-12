const assert = require('node:assert/strict');
global.window = global; global.self = global; global.navigator = { userAgent: 'node' };
global.document = { baseURI: 'http://localhost/', createElement: () => ({ getContext: () => null, style: {}, addEventListener: () => {} }), addEventListener: () => {}, removeEventListener: () => {} };
global.location = { search: '', href: 'http://localhost/', protocol: 'http:', hostname: 'localhost' };
global.requestAnimationFrame = fn => setTimeout(fn, 16);
global.addEventListener = () => {}; global.removeEventListener = () => {};
for (const name of ['WebGLShader', 'WebGLProgram', 'WebGLBuffer', 'WebGLTexture', 'WebGLFramebuffer', 'WebGLRenderbuffer', 'WebGLRenderingContext', 'WebGL2RenderingContext', 'WebGLUniformLocation', 'WebGLVertexArrayObject', 'WebGLActiveInfo', 'HTMLCanvasElement', 'HTMLImageElement', 'Image', 'OffscreenCanvas', 'ImageBitmap', 'Audio', 'HTMLVideoElement', 'XMLHttpRequest']) if (!global[name]) global[name] = class {};

const mod = require(process.env.CCPWGL_TEST_BUNDLE || '../dist/ccpwgl2_int.js'), tw2 = mod.tw2;
const make = name => new (tw2.GetClass(name))();
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-5, a+' != '+b);
const identity = new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
for (const name of ['Allign','ApproachGroup','BackAndForth','CollisionAvoidance','DroneAvoidance','FollowASpline','Formation','InclusionVolume','Inertia','PlayFX','ProcessLifetime','SeekTarget','SpawnDrones','Wander','EveSphereVolume','EveBoxVolume','EveEllipsoidVolume']) assert.ok(make(name));
const sys=make('EveChildBehaviorSystem'), g=make('BehaviorGroup');
g.count=1;g.maxVelocity=5;g.InitializeGeometryResource();
let agent=g.GetAgents()[0];agent.acceleration[0]=100;g.UpdateAgents(0.5,sys);
near(agent.position[0],0.5);near(agent.velocity[0],5);near(agent.lifetime,0.1);assert.deepEqual(Array.from(agent.acceleration),[0,0,0]);
g.display=false;g.UpdateAgents(0.1,sys);near(agent.lifetime,0.1);
g.display=true;g.currentScreenSize=100;agent.isVisible=true;agent.xfade=0;
const packed=new Float32Array(24);g.GetShipInfoForBuffer(packed,identity);near(packed[3],0.5);agent.position[0]=2;g.GetShipInfoForBuffer(packed,identity);near(packed[3],2);near(packed[15],0.5);
const g2=make('BehaviorGroup');g2.count=2;g2.InitializeGeometryResource();sys.behaviorGroups=[g,g2];sys.ChangeBufferInstanceCount();assert.equal(g2._instanceDeclaration.elements[0].offset,96);assert.equal(g2._instanceDeclaration.elements[5].offset,176);
const parent=identity.slice();parent[12]=123;sys.translation[1]=4;sys.PrepareLod(parent);near(sys.worldTransform[12],123);near(sys.worldTransform[13],4);
const sphere=make('EveSphereVolume');sphere.radius=10;sphere.innerRadius=2;near(sphere.GetIntensity([6,0,0]),2/3);assert.equal(sphere.GetIntensity([11,0,0]),0);
const inclusion=make('InclusionVolume');inclusion.inclusionVolumes=[sphere];agent.position.set([6,0,0]);agent.acceleration.fill(0);inclusion.CalculateBehavior([agent],null,0,g,sys,[]);near(agent.acceleration[0],-60);
const spawn=make('SpawnDrones');spawn.gridInfo.set([2,2,1,10]);spawn.UpdateGrid(g);assert.equal(g.GetSize(),4);assert.deepEqual(g.GetAgents().map(a=>Array.from(a.position)),[[0,0,0],[10,0,0],[0,10,0],[10,10,0]]);
const tunnel=make('SplineTunnelGroup');tunnel.curveSets=[{Length:()=>3,GetValue:(t,out)=>{out[0]=t;return out;}}];tunnel.Initialize();assert.deepEqual(tunnel.GetTunnels()[0].splinePoints.map(p=>p.pos[0]),[0,1,2,3]);tunnel.breakPoints=1;tunnel.OnValueChanged();assert.equal(tunnel.GetTunnels()[0].splinePoints.length,3);
const seek=make('SeekTarget');assert.equal(seek.GetLocatorsForSet('missing'),null);seek.locatorSet.name='local';assert.equal(seek.GetLocatorsForSet('local'),seek.locatorSet.locators);
const play=make('PlayFX');let calls=0;play.generatedFiringEffects=[{Update:()=>calls++,UpdateViewDependentData:()=>calls++,GetBatches:()=>true,GetResources:o=>o}];play.UpdateAsyncronous({dt:0.1},identity);assert.equal(calls,2);assert.equal(play.GetBatches(0,{},{}),true);
g.behaviors=[play];g.SetPlayFXBehavior();assert.equal(g._playFXBehavior,play);g.behaviors=[];g.SetPlayFXBehavior();assert.equal(g._playFXBehavior,null);
console.log('Behavior numeric, lifecycle and packing tests passed');


const state=make('Tr2StateMachineState');state.actions=[make('Tr2ActionSetValue'),make('Tr2ActionAnimateValue')];
const machine=make('Tr2StateMachine');machine.states=[state];machine.startState=state;
const copy=machine.Clone();assert.notEqual(copy.states[0],state);assert.equal(copy.startState,copy.states[0]);assert.equal(copy.states[0].actions[0].constructor,state.actions[0].constructor);assert.notEqual(copy.states[0].actions[0],state.actions[0]);
assert.throws(()=>make('Tr2StateMachineState').SetValues({actions:[make('EveSphereVolume')]}),/Unexpected struct/);
const boolChild=make('EveChildContainer');boolChild.display=0;assert.equal(boolChild.Clone().display,false);
assert.ok(tw2.GetClass('EveChildUpdateParams').DEFAULT.localToWorldTransform);make('EveChildBehaviorSystem').Update(0.01);
console.log('Polymorphic graph clone and child defaults passed');

const root=make('EveChildContainer'),child=make('EveChildMesh'),mesh=make('Tw2Mesh'),area=make('Tw2MeshArea'),area2=make('Tw2MeshArea'),effect=make('Tw2Effect'),param=make('Tw2FloatParameter');
param.name='Intensity';param.value=3;effect.parameters.Intensity=param;area.effect=area2.effect=effect;mesh.opaqueAreas=[area,area2];child.mesh=mesh;root.objects=[child];
const cs=make('Tw2CurveSet'),b1=make('Tw2ValueBinding'),b2=make('Tw2ValueBinding');b1.destinationObject=param;b1.destinationAttribute='value';b2.destinationObject=area;b2.destinationAttribute='display';cs.bindings=[b1,b2];root.curveSets=[cs];
const cloned=root.Clone({skipUpdate:true}),ca=cloned.objects[0].mesh.opaqueAreas;
assert.equal(ca[0].effect,ca[1].effect);assert.notEqual(ca[0].effect,effect);assert.equal(cloned.curveSets[0].bindings[0].destinationObject,ca[0].effect.parameters.Intensity);assert.equal(cloned.curveSets[0].bindings[1].destinationObject,ca[0]);
ca[0].effect.parameters.Intensity.value=7;assert.equal(param.value,3);
console.log('Mesh area and shader parameter binding identities passed');

// Read-only runtime fields must not clone the previous generation recursively.
const fxBehavior=make('PlayFX');fxBehavior.generatedFiringEffects=[make('EveStretch3')];assert.equal(fxBehavior.Clone({skipUpdate:true}).generatedFiringEffects.length,0);
const liveTarget=make('Tr2ActionSetExternalControllerVariable');liveTarget.destination=make('Tr2Controller');assert.equal(liveTarget.Clone({skipUpdate:true}).destination,null);
const pg=make('BehaviorGroup');const priorities=[4,0,3,1],order=[];pg.count=1;pg.behaviors=priorities.map((priority,index)=>{const b=make('IBehavior');b.GetProcessPriority=()=>priority;b.CalculateBehavior=()=>{order.push(index);return [];};return b;});pg.InitializeGeometryResource();pg.UpdateAgents(1/60,sys);assert.deepEqual(order,[1,3,2,0]);
// Multiple render passes retain the previous frame rather than the previous pass.
const hg=make('BehaviorGroup');hg.count=1;hg.InitializeGeometryResource();hg.currentScreenSize=100;const ha=hg.GetAgents()[0];ha.isVisible=true;ha.position[0]=1;hg.GetShipInfoForBuffer(packed,identity);ha.position[0]=2;hg.GetShipInfoForBuffer(packed,identity);near(packed[15],1);hg.GetShipInfoForBuffer(packed,identity,0,false);near(packed[15],1);
console.log('Runtime-only cloning, behavior priorities and multipass history passed');

const booster=make('BehaviorGroupBooster');booster.ambientFlareNoiseAmplitude=0;const lightWorld=identity.slice();lightWorld[12]=10;const collected=[];booster.AddLight({AddLight:r=>collected.push({position:Array.from(r.position),radius:r.radius})},[1,2,3],2,0,lightWorld);assert.deepEqual(collected,[{position:[11,2,3],radius:7}]);booster.display=false;booster.AddLight({AddLight:()=>assert.fail('hidden booster emitted a light')},[0,0,0],1,0,identity);
console.log('Booster light placement, radius and display passed');
