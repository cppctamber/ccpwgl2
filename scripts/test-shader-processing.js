/* eslint-env node */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname, '../src', p), 'utf8').replace(/^import[\s\S]*?from "[^"]+";\r?\n/gm, '').replace(/^\s*@.*$/gm, '').replace(/^export /gm, '');
const Scheduler = new Function(read('core/engine/Tw2ResourceProcessing.js')+';return Tw2ResourceProcessing;')();
const scheduler = new Scheduler();
let now=0, completed=false, checks=0, links=0, deleted=0, binds=0, ext={COMPLETION_STATUS_KHR:4};
const gl={LINK_STATUS:1, ACTIVE_UNIFORMS:2, COMPILE_STATUS:3, VERTEX_SHADER:5, FRAGMENT_SHADER:6,
 createProgram:()=>({}), attachShader(){}, linkProgram(){links++;}, createShader:()=>({}), shaderSource(){}, compileShader(){},
 getShaderParameter(){throw Error('Early compile status query');}, isContextLost:()=>false,
 getProgramParameter(p,key){ if(key===4){checks++; return completed;} if(key===1){assert.ok(completed,'LINK_STATUS queried before completion'); return p.valid!==false;} if(key===2)return 0; throw Error('unexpected query');},
 getShaderInfoLog:()=>'', getProgramInfoLog:()=>'', deleteShader(){}, deleteProgram(){deleted++;}, useProgram(){}, getUniformLocation:()=>null, uniform1i(){}, uniform3f(){}, getAttribLocation:()=>-1};
const device={gl, GetExtension:name=>name==='KHR_parallel_shader_compile'?ext:null};
const resMan={processing:scheduler};
class Base{OnPrepared(){} OnError(){} }
const Compilation=new Function('device','resMan','Tw2Resource',read('core/shader/Tw2ShaderCompilation.js')+';return Tw2ShaderCompilation;')(device,resMan,Base);
class Declaration{elements=[];RebuildHash(){}}
const Program=new Function('device','tw2','Tw2VertexDeclaration','Tw2VertexElement','ErrShaderLink','Tw2ShaderCompilation',read('core/shader/Tw2ShaderProgram.js')+';return Tw2ShaderProgram;')(device,{},Declaration,{},Error,Compilation);
const rawStage=read('core/shader/Tw2ShaderStage.js');
const start=rawStage.indexOf('    static compileShader('),end=rawStage.indexOf('    /**',start);
const compile=new Function('device','Tw2ShaderCompilation','isString','BytesToString','ErrShaderCompile','return ({'+rawStage.slice(start,end).replace('static compileShader','compileShader')+'}).compileShader;')(device,Compilation,x=>typeof x==='string',x=>x,Error);
const parent={KeepAlive(){},OnError(e){this.error=e;}};
const batch=new Compilation(parent), shader={};
Compilation.current=batch;
const vertex=compile(0,'','void main(){}\n','test'),fragment=compile(1,'','void main(){}\n','test');
const pass={stages:[{inputDefinition:{elements:[]}},{samplers:[],constants:[]} ]};
pass.shaderProgram=Program.create(vertex,fragment,pass,{path:'test'});
pass.shadowShaderProgram=Program.create(vertex,fragment,pass,{path:'test'},true);
pass.shadowShaderProgram.program.valid=false;
Compilation.current=null;
assert.equal(links,2);assert.equal(checks,0);assert.equal(pass.shaderProgram.constantBufferHandles.length,0);
batch.Queue(shader); batch.callbacks.push(()=>{assert.equal(shader._isReady,true);binds++;});
scheduler.Pump(()=>now,10);assert.equal(checks,0);assert.equal(shader._isReady,false);
scheduler.Pump(()=>now,10);assert.equal(checks,1,'Poll the waiting batch once per tick');assert.equal(binds,0);
completed=true;scheduler.Pump(()=>now,10);
assert.equal(binds,1);assert.equal(batch.HasCompleted(),true);assert.equal(pass.shadowShaderProgram,pass.shaderProgram);assert.equal(deleted,1);
// Context loss cancels pending programs and reports failure rather than hanging.
completed=false;const lost=new Compilation(parent);lost.programs.push({program:{},FinishCompilation(){throw Error('should not reflect');}});lost.Queue({});
scheduler.Pump(()=>now,10);gl.isContextLost=()=>true;scheduler.Pump(()=>now,10);assert.match(parent.error.message,/context lost/);assert.equal(scheduler.size,0);
// Without KHR, defer validation to processing and finish one program per step.
gl.isContextLost=()=>false;ext=null;completed=true;const fallback=new Compilation(parent);fallback.programs.push({program:{},FinishCompilation(){now+=8;}},{program:{},FinishCompilation(){now+=8;}});fallback.Queue({});
scheduler.Pump(()=>now,10);assert.equal(fallback.HasCompleted(),false);scheduler.Pump(()=>now,10);assert.equal(fallback.HasCompleted(),true);
console.log('Shader processing: deferred compile/link checks, completion polling, reflection, binding, optional shadow fallback, context loss and non-KHR fallback passed');
const effectSource=read('core/mesh/Tw2Effect.js');
const bindStart=effectSource.indexOf('    _BindShader('),bindEnd=effectSource.indexOf('    BindParameters(',bindStart);
const bindShader=new Function('return ({'+effectSource.slice(bindStart,bindEnd)+'})._BindShader;')();
let bound=0,notified=0;
const effect={effectRes:{},UnBindParameters(){},BindParameters(){assert.equal(this._pendingShaderBinding,false);bound++;return true;}};
const pendingShader={_isReady:false,_compilation:{callbacks:[]}};
bindShader.call(effect,pendingShader,{},()=>notified++);
assert.equal(bound,0);assert.equal(effect._pendingShaderBinding,true);
pendingShader._isReady=true;pendingShader._compilation.callbacks.shift()();
assert.equal(bound,1);assert.equal(notified,1);
pendingShader._isReady=false;bindShader.call(effect,pendingShader,{},()=>notified++);
bindShader.call(effect,{_isReady:true},{},()=>notified++);
pendingShader._compilation.callbacks.shift()();assert.equal(bound,2);assert.equal(notified,2,'Stale completion must not bind or emit prepared');
console.log('Effect binding: delayed readiness and stale permutation completion passed');
