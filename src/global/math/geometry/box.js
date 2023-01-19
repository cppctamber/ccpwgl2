import { vec3 } from "../vec3";
import { toJSON } from "../vertex";


/**
 * Creates a box
 * @author Three.js converted
 * @param {Object} [options={}]
 * @param {Number} [options.width=1]
 * @param {Number} [options.height=1]
 * @param {Number} [options.depth=1]
 * @param {Number} [widthSegments=1]
 * @param {Number} [heightSegments=1]
 * @param {Number} [depthSegments=1]
 * @returns {Object}
 */
export function createBox(options = {})
{
    let {
        width = 1,
        height = 1,
        depth = 1,
        widthSegments = 1,
        heightSegments = 1,
        depthSegments = 1
    } = options;

    widthSegments = Math.floor(widthSegments);
    heightSegments = Math.floor(heightSegments);
    depthSegments = Math.floor(depthSegments);

    const
        indices = [],
        positions = [],
        normals = [],
        uvs = [];

    let numberOfVertices = 0;

    function buildPlane(u, v, w, udir, vdir, width, height, depth, gridX, gridY)
    {
        const
            segmentWidth = width / gridX,
            segmentHeight = height / gridY,
            widthHalf = width / 2,
            heightHalf = height / 2,
            depthHalf = depth / 2,
            gridX1 = gridX + 1,
            gridY1 = gridY + 1;

        let vertexCounter = 0;

        const vec3_0 = vec3.alloc();

        // generate vertices, normals and uvs

        for (let iy = 0; iy < gridY1; iy++)
        {
            const y = iy * segmentHeight - heightHalf;

            for (let ix = 0; ix < gridX1; ix++)
            {
                const x = ix * segmentWidth - widthHalf;
                // set values to correct vec3_0 component
                vec3_0[u] = x * udir;
                vec3_0[v] = y * vdir;
                vec3_0[w] = depthHalf;
                // now apply vec3_0 to vertex buffer
                positions.push(vec3_0[0], vec3_0[1], vec3_0[2]);
                // set values to correct vec3_0 component
                vec3_0[u] = 0;
                vec3_0[v] = 0;
                vec3_0[w] = depth > 0 ? 1 : -1;
                // now apply vec3_0 to normal buffer
                normals.push(vec3_0[0], vec3_0[1], vec3_0[2]);
                // uvs
                uvs.push(ix / gridX);
                uvs.push(1 - (iy / gridY));
                // counters
                vertexCounter += 1;
            }
        }

        vec3.unalloc(vec3_0);

        // indices
        // 1. you need three indices to draw a single face
        // 2. a single segment consists of two faces
        // 3. so we need to generate six (2*3) indices per segment
        for (let iy = 0; iy < gridY; iy++)
        {
            for (let ix = 0; ix < gridX; ix++)
            {
                const
                    a = numberOfVertices + ix + gridX1 * iy,
                    b = numberOfVertices + ix + gridX1 * (iy + 1),
                    c = numberOfVertices + (ix + 1) + gridX1 * (iy + 1),
                    d = numberOfVertices + (ix + 1) + gridX1 * iy;
                // faces
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        // update total number of vertices
        numberOfVertices += vertexCounter;
    }

    buildPlane(2, 1, 0, - 1, - 1, depth, height,   width,  depthSegments, heightSegments); // px
    buildPlane(2, 1, 0,   1, - 1, depth, height, - width,  depthSegments, heightSegments); // nx
    buildPlane(0, 2, 1,   1,   1, width, depth,    height, widthSegments, depthSegments);  // py
    buildPlane(0, 2, 1,   1, - 1, width, depth,  - height, widthSegments, depthSegments);  // ny
    buildPlane(0, 1, 2,   1, - 1, width, height,   depth,  widthSegments, heightSegments); // pz
    buildPlane(0, 1, 2, - 1, - 1, width, height, - depth,  widthSegments, heightSegments); // nz

    // Normalize
    const result = toJSON(indices, positions, uvs, normals);
    result.shape = {
        factory: createBox,
        options: {
            width,
            height,
            depth,
            widthSegments,
            heightSegments,
            depthSegments
        }
    };
    return result;

}

