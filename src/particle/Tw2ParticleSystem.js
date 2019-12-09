import { meta, vec3, mat4, device, Tw2BaseClass } from "global";
import { Tw2VertexDeclaration } from "core";
import { Tw2ParticleElement } from "./element";


/**
 * Tw2ParticleSystem
 *
 * @property {String} name                                      - The particle system's name
 * @property {Boolean} applyAging                               - Applies aging
 * @property {Boolean} applyForce                               - Applies particle forces
 * @property {Array.<Tw2ParticleConstraint>} constraints        - Particle constraints
 * @property {Array.<Tw2ParticleElementDeclaration>} elements   - Particle elements
 * @property {Tw2ParticleEmitter} emitParticleDuringLifeEmitter - Particle emitter called when alive
 * @property {Tw2ParticleEmitter} emitParticleOnDeathEmitter    - Particle emitter called when dead
 * @property {Array.<Tw2ParticleForce>} forces                  - Particle forces
 * @property {Boolean} isGlobal                                 - unused?
 * @property {Number} maxParticleCount                          - Maximum particle count
 * @property {number} peakAliveCount                            - unused?
 * @property {Boolean} requiresSorting                          - Identifies that particles require sorting
 * @property {Boolean} updateBoundingBox                        - Identifies that bounds require updating
 * @property {Boolean} updateSimulation                         - Identifies that forces an constraints are used
 * @property {Boolean} useSimTimeRebase                         -
 * @property {vec3} _aabbMin                                    - Axis aligned bounding box min
 * @property {vec3} _aabbMax                                    - Axis aligned bounding box max
 * @property {number} _aliveCount                               - The current particle count
 * @property {Boolean} _bufferDirty                             - Identifies that buffers require rebuilding
 * @property {Array} _buffers                                   -
 * @property {Tw2VertexDeclaration} _declaration                - Instance declaration
 * @property {Array<Tw2ParticleElement>} _elements              -
 * @property {Array} _instanceStride                            -
 * @property {Boolean} _isValid                                 - Identifies that the particle system is good
 * @property {Float32Array} _distancesBuffer                    -
 * @property {Float32Array} _sortedBuffer                       -
 * @property {Array} _sortedIndexes                             -
 * @property {Array<Tw2ParticleElement>} _stdElements           - Standard particle elements
 * @property {WebGLBuffer} _vb                                  - Vertex buffer
 * @property {Array} _vertexStride                              - Vertex stride
 */
@meta.ccp("Tr2ParticleSystem")
export class Tw2ParticleSystem extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.boolean
    applyAging = true;

    @meta.black.boolean
    applyForce = true;

    @meta.black.list
    constraints = [];

    @meta.black.list
    elements = [];

    @meta.black.object
    emitParticleDuringLifeEmitter = null;

    @meta.black.object
    emitParticleOnDeathEmitter = null;

    @meta.black.list
    forces = [];

    @meta.black.uint
    maxParticleCount = 0;

    @meta.black.boolean
    requiresSorting = false;

    @meta.black.boolean
    updateBoundingBox = false;

    @meta.black.boolean
    updateSimulation = true;

    @meta.black.boolean
    @meta.notImplemented
    useSimTimeRebase = false;

    @meta.todo("This is unused, remove it?")
    isGlobal = false;

    @meta.todo("This is unused, remove it?")
    peakAliveCount = 0;

    _aabbMin = vec3.create();
    _aabbMax = vec3.create();
    _aliveCount = 0;
    _bufferDirty = false;
    _buffers = [ null, null ];
    _declaration = null;
    _elements = [];
    _instanceStride = [ null, null ];
    _isValid = false;
    _distancesBuffer = null; //Float32Array
    _sortedBuffer = null; //Float32Array
    _sortedIndexes = null; // Array
    _stdElements = [ null, null, null, null ];
    _vb = null;
    _vertexStride = [ null, null ];


    /**
     * Constructor
     */
    constructor()
    {
        super();
        Tw2ParticleSystem.init();
    }

    /**
     * Initializes the Particle System
     */
    Initialize()
    {
        this.UpdateElementDeclaration();
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        return out;
    }

    /**
     * Updates Element Declarations
     */
    UpdateElementDeclaration()
    {
        this._isValid = false;
        const gl = device.gl;

        if (this._vb)
        {
            gl.deleteBuffer(this._vb);
            this._vb = null;
        }

        this._declaration = null;
        this._aliveCount = 0;

        if (this.elements.length === 0) return;

        this._stdElements = [ null, null, null, null ];
        this._elements = [];
        this._instanceStride = [ 0, 0 ];
        this._vertexStride = [ 0, 0 ];
        this._declaration = new Tw2VertexDeclaration();
        this._buffers = [ null, null ];

        for (let i = 0; i < this.elements.length; ++i)
        {
            const
                bufferIndex = this.elements[i].usedByGPU ? 0 : 1,
                src = this.elements[i];

            const el = Tw2ParticleElement.from({
                elementType: src.elementType,
                customName: src.customName,
                dimension: src.GetDimension(),
                usageIndex: src.usageIndex,
                usedByGPU: src.usedByGPU
            });

            //el.buffer = this._buffers[bufferIndex];

            el.startOffset = this._vertexStride[bufferIndex];
            el.offset = el.startOffset;
            if (this.elements[i].elementType !== Tw2ParticleElement.Type.CUSTOM)
            {
                this._stdElements[this.elements[i].elementType] = el;
            }
            this._vertexStride[bufferIndex] += el.dimension;
            this._elements.push(el);
            if (bufferIndex === 0)
            {
                const d = this.elements[i].GetDeclaration();
                d.offset = el.startOffset * 4;
                this._declaration.elements.push(d);
            }
        }

        this._declaration.RebuildHash();

        for (let i = 0; i < this._elements.length; ++i)
        {
            const bufferIndex = this._elements[i].usedByGPU ? 0 : 1;
            this._elements[i].vertexStride = this._vertexStride[bufferIndex];
        }

        this._instanceStride[0] = this._vertexStride[0] * 4;
        this._instanceStride[1] = this._vertexStride[1] * 4;

        for (let i = 0; i < this._elements.length; ++i)
        {
            const bufferIndex = this._elements[i].usedByGPU ? 0 : 1;
            this._elements[i].instanceStride = this._instanceStride[bufferIndex];
        }

        this._buffers = [ null, null ];
        if (this._instanceStride[0] && this.maxParticleCount)
        {
            this._buffers[0] = new Float32Array(this._instanceStride[0] * this.maxParticleCount);
            this._vb = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vb);
            gl.bufferData(gl.ARRAY_BUFFER, this._buffers[0].length, gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        if (this._instanceStride[1])
        {
            this._buffers[1] = new Float32Array(this._instanceStride[1] * this.maxParticleCount);
        }

        for (let i = 0; i < this._elements.length; ++i)
        {
            const bufferIndex = this._elements[i].usedByGPU ? 0 : 1;
            this._elements[i].buffer = this._buffers[bufferIndex];
        }

        if (this.requiresSorting)
        {
            this._sortedIndexes = new Array(this.maxParticleCount);
            this._sortedBuffer = new Float32Array(this._instanceStride[0] * this.maxParticleCount);
            this._distancesBuffer = new Float32Array(this.maxParticleCount);
        }

        this._isValid = true;
        this._bufferDirty = true;
    }

    /**
     * Checks if an element type exists
     * @param {number} type
     * @returns {Boolean}
     */
    HasElement(type)
    {
        return this._stdElements[type] !== null;
    }

    /**
     * Gets an element by it's type
     * @param {number} type
     * @returns {Tw2ParticleElement}
     */
    GetElement(type)
    {
        if (this._stdElements[type])
        {
            this._stdElements[type].offset = this._stdElements[type].startOffset;
        }
        return this._stdElements[type];
    }

    /**
     * Begins particle spawning
     * @returns {?number}
     */
    BeginSpawnParticle()
    {
        if (!this._isValid || this._aliveCount >= this.maxParticleCount) return null;
        return this._aliveCount++;
    }

    /**
     * Ends particle spawning
     */
    EndSpawnParticle()
    {
        this._bufferDirty = true;
    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    Update(dt)
    {
        dt = Math.min(dt, 0.1);

        if (this.applyAging && this.HasElement(Tw2ParticleElement.Type.LIFETIME))
        {
            const
                lifetime = this.GetElement(Tw2ParticleElement.Type.LIFETIME),
                position = this.emitParticleOnDeathEmitter ? this.GetElement(Tw2ParticleElement.Type.POSITION) : null,
                velocity = this.emitParticleOnDeathEmitter ? this.GetElement(Tw2ParticleElement.Type.VELOCITY) : null;

            for (let i = 0; i < this._aliveCount; ++i)
            {
                lifetime.buffer[lifetime.offset] += dt / lifetime.buffer[lifetime.offset + 1];
                if (lifetime.buffer[lifetime.offset] > 1)
                {
                    if (this.emitParticleOnDeathEmitter)
                    {
                        this.emitParticleOnDeathEmitter.SpawnParticles(position, velocity, 1);
                    }

                    this._aliveCount--;
                    if (i < this._aliveCount)
                    {
                        for (let j = 0; j < 2; ++j)
                        {
                            if (this._buffers[j])
                            {
                                this._buffers[j].set(this._buffers[j].subarray(this._instanceStride[j] * this._aliveCount, this._instanceStride[j] * this._aliveCount + this._instanceStride[j]), i * this._instanceStride[j]);
                            }
                        }
                        --i;
                        this._bufferDirty = true;
                    }
                }
                else
                {
                    lifetime.offset += lifetime.instanceStride;
                    if (position) position.offset += position.instanceStride;
                    if (velocity) velocity.offset += velocity.instanceStride;
                }
            }
            lifetime.dirty = true;
        }

        const vec3_0 = Tw2ParticleSystem.global.vec3_0;

        if (this.updateSimulation && this.HasElement(Tw2ParticleElement.Type.POSITION) && this.HasElement(Tw2ParticleElement.Type.VELOCITY))
        {
            const hasForces = this.applyForce && this.forces.length;
            for (let i = 0; i < this.forces.length; ++i)
            {
                this.forces[i].Update(dt);
            }

            const
                position = this.GetElement(Tw2ParticleElement.Type.POSITION),
                velocity = this.GetElement(Tw2ParticleElement.Type.VELOCITY),
                mass = hasForces ? this.GetElement(Tw2ParticleElement.Type.MASS) : null;

            for (let i = 0; i < this._aliveCount; ++i)
            {
                if (hasForces)
                {
                    const
                        amass = mass ? mass.buffer[mass.offset] : 1,
                        force = vec3.set(vec3_0, 0, 0, 0);

                    for (let j = 0; j < this.forces.length; ++j)
                    {
                        this.forces[j].ApplyForce(position, velocity, force, dt, amass);
                    }

                    if (mass) vec3.scale(force, force, 1 / mass.buffer[mass.offset]);

                    velocity.buffer[velocity.offset] += force[0] * dt;
                    velocity.buffer[velocity.offset + 1] += force[1] * dt;
                    velocity.buffer[velocity.offset + 2] += force[2] * dt;
                }

                position.buffer[position.offset] += velocity.buffer[velocity.offset] * dt;
                position.buffer[position.offset + 1] += velocity.buffer[velocity.offset + 1] * dt;
                position.buffer[position.offset + 2] += velocity.buffer[velocity.offset + 2] * dt;

                if (this.emitParticleDuringLifeEmitter)
                {
                    this.emitParticleDuringLifeEmitter.SpawnParticles(position, velocity, dt);
                }

                position.offset += position.instanceStride;
                velocity.offset += velocity.instanceStride;

                if (mass) mass.offset += mass.instanceStride;
            }
            position.dirty = true;
            velocity.dirty = true;
        }

        if (this.updateSimulation && this.constraints.length)
        {
            for (let i = 0; i < this.constraints.length; ++i)
            {
                this.constraints[i].ApplyConstraint(this._buffers, this._instanceStride, this._aliveCount, dt);
            }
        }

        if (this.updateBoundingBox)
        {
            this.GetBoundingBox(this._aabbMin, this._aabbMax);
        }

        if (this.emitParticleDuringLifeEmitter && !(this.HasElement(Tw2ParticleElement.Type.POSITION) && this.HasElement(Tw2ParticleElement.Type.VELOCITY)) && this.updateSimulation)
        {
            const
                position = this.GetElement(Tw2ParticleElement.Type.POSITION),
                velocity = this.GetElement(Tw2ParticleElement.Type.VELOCITY);

            for (let i = 0; i < this._aliveCount; ++i)
            {
                this.emitParticleDuringLifeEmitter.SpawnParticles(position, velocity, 1);
                if (position) position.offset += position.instanceStride;
                if (velocity) velocity.offset += velocity.instanceStride;
            }
        }

        for (let i = 0; i < this._elements.length; ++i)
        {
            const el = this._elements[i];
            el.offset = el.startOffset;
            if (el.dirty)
            {
                this._bufferDirty = true;
                el.dirty = false;
            }
        }
    }

    /**
     * Gets bounding box
     * @param {vec3} aabbMin
     * @param {vec3} aabbMax
     * @returns {Boolean}
     */
    GetBoundingBox(aabbMin, aabbMax)
    {
        if (this._aliveCount && this.HasElement(Tw2ParticleElement.Type.POSITION))
        {
            const position = this.GetElement(Tw2ParticleElement.Type.POSITION);
            aabbMin[0] = position.buffer[position.offset];
            aabbMin[1] = position.buffer[position.offset + 1];
            aabbMin[2] = position.buffer[position.offset + 2];
            aabbMax[0] = position.buffer[position.offset];
            aabbMax[1] = position.buffer[position.offset + 1];
            aabbMax[2] = position.buffer[position.offset + 2];
            for (let i = 0; i < this._aliveCount; ++i)
            {
                aabbMin[0] = Math.min(aabbMin[0], position.buffer[position.offset]);
                aabbMin[1] = Math.min(aabbMin[1], position.buffer[position.offset + 1]);
                aabbMin[2] = Math.min(aabbMin[2], position.buffer[position.offset + 2]);
                aabbMax[0] = Math.max(aabbMax[0], position.buffer[position.offset]);
                aabbMax[1] = Math.max(aabbMax[1], position.buffer[position.offset + 1]);
                aabbMax[2] = Math.max(aabbMax[2], position.buffer[position.offset + 2]);
                position.offset += position.instanceStride;
            }
            return true;
        }
        return false;
    }

    /**
     * _Sort
     * @private
     */
    _Sort()
    {
        const
            eye = mat4.multiply(Tw2ParticleSystem.global.mat4_0, device.projection, device.view), //device.viewInverse;
            position = this.GetElement(Tw2ParticleElement.Type.POSITION),
            count = this._aliveCount,
            distances = this._distancesBuffer;

        for (let i = 0; i < count; ++i)
        {
            const o0 = position.offset + position.instanceStride * i;
            let dd = position.buffer[o0] - eye[12],
                l0 = dd * dd;

            dd = position.buffer[o0 + 1] - eye[13];
            l0 += dd * dd;
            dd = position.buffer[o0 + 2] - eye[14];
            l0 += dd * dd;
            distances[i] = l0;
        }

        /**
         * sortItems
         * @param a
         * @param b
         * @returns {number}
         * @private
         */
        function sortItems(a, b)
        {
            if (a >= count && b >= count)
            {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            }

            if (a >= count) return 1;
            if (b >= count) return -1;

            const
                l0 = distances[a],
                l1 = distances[b];

            if (l0 < l1) return 1;
            if (l0 > l1) return -1;
            return 0;
        }

        for (let i = 0; i < this.maxParticleCount; ++i)
        {
            this._sortedIndexes[i] = i;
        }

        this._sortedIndexes.sort(sortItems);
    }

    /**
     * Updates and gets the particle system's InstanceBuffer
     * @returns {?WebGLBuffer}
     */
    GetInstanceBuffer()
    {
        if (this._aliveCount === 0) return undefined;

        const gl = device.gl;
        if (this.requiresSorting && this.HasElement(Tw2ParticleElement.Type.POSITION) && this._buffers)
        {
            this._Sort();

            const
                stride = this._instanceStride[0],
                gpuBuffer = this._buffers[0];

            for (let i = 0; i < this._aliveCount; ++i)
            {
                const
                    toOffset = i * stride,
                    fromOffset = this._sortedIndexes[i] * stride;

                for (let j = 0; j < stride; ++j)
                {
                    this._sortedBuffer[toOffset + j] = gpuBuffer[j + fromOffset];
                }
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, this._vb);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._sortedBuffer.subarray(0, this._vertexStride[0] * this._aliveCount));
            this._bufferDirty = false;
        }
        else if (this._bufferDirty)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._vb);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._buffers[0].subarray(0, this._vertexStride[0] * this._aliveCount));
            this._bufferDirty = false;
        }

        return this._vb;
    }

    /**
     * Gets the particle system's InstanceDeclaration
     * @returns {Tw2VertexDeclaration}
     */
    GetInstanceDeclaration()
    {
        return this._declaration;
    }

    /**
     * Gets the particle system's InstanceStride
     * @returns {number}
     */
    GetInstanceStride()
    {
        return this._instanceStride[0];
    }

    /**
     * Gets the particle system's InstanceCount
     * @returns {number}
     */
    GetInstanceCount()
    {
        return this._aliveCount;
    }

    /**
     * Initializes class globals
     */
    static init()
    {
        if (Tw2ParticleElement.global) return;

        Tw2ParticleSystem.global = {
            vec3_0: vec3.create(),
            mat4_0: mat4.create()
        };
    }

    /**
     * Global and scratch variables
     */
    static global = null;

}
