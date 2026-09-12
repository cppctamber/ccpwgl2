import assert from 'node:assert/strict';
import { restoreGr2VertexChannels } from '../src/core/reader/geometry/Gr2Preparation.js';

const vertices = [
    { Position: [1, 2, 3, 17], TextureCoordinates0: [8, 9, 10, 11] },
    { Position: [4, 5, 6, 23], TextureCoordinates0: [12, 13, 14, 15] }
];
Object.defineProperty(vertices, '__type', { value: [
    { name: 'Position', type: 10, arrayWidth: 4 },
    { name: 'TextureCoordinates0', type: 21, arrayWidth: 4 }
] });
const raw = { fileInfo: { Meshes: [{ PrimaryVertexData: { Vertices: vertices } }] } };
const json = { meshes: [{ vertex: { position: [1, 2, 3, 4, 5, 6], texcoord0: [8, 9, 12, 13] } }] };
restoreGr2VertexChannels(raw, json);
assert.equal(json.meshes[0].vertexCount, 2);
assert.deepEqual(json.meshes[0].vertex.position, [1, 2, 3, 17, 4, 5, 6, 23]);
assert.deepEqual(json.meshes[0].vertex.texcoord0, [8, 9, 10, 11, 12, 13, 14, 15]);
const once = JSON.stringify(json);
restoreGr2VertexChannels(raw, json);
assert.equal(JSON.stringify(json), once);

// Ordinary xyz meshes retain their inferred count and existing channels.
const ordinary = [{ Position: [1, 2, 3], TextureCoordinates0: [0, 1] }];
Object.defineProperty(ordinary, '__type', { value: [
    { name: 'Position', type: 10, arrayWidth: 3 },
    { name: 'TextureCoordinates0', type: 21, arrayWidth: 2 }
] });
const legacy = { meshes: [{ vertex: { position: [1, 2, 3], texcoord0: [0, 1] } }] };
const original = JSON.stringify(legacy);
restoreGr2VertexChannels({ fileInfo: { Meshes: [{ PrimaryVertexData: { Vertices: ordinary } }] } }, legacy);
assert.equal(JSON.stringify(legacy), original);
console.log('Traffic channel recovery, idempotence and ordinary meshes passed');
