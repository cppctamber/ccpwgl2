import { vec3 } from "../vec3";
import { toJSON } from "../vertex";

/**
 * Creates a sphere
 * @author Three.js converted
 *
 *
 **/
export function createSphere(options = {})
{

    let {
        radius = 1,
        widthSegments = 32,
        heightSegments = 16,
        phiStart = 0,
        phiLength = Math.PI * 2,
        thetaStart = 0,
        thetaLength = Math.PI
    } = options;

    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));

    const
        thetaEnd = Math.min(thetaStart + thetaLength, Math.PI),
        grid = [],
        vertex = vec3.alloc(),
        normal = vec3.alloc();

    let index = 0;

    // buffers
    const
        indices = [],
        vertices = [],
        normals = [],
        uvs = [];

    // generate vertices, normals and uvs
    for (let iy = 0; iy <= heightSegments; iy++)
    {
        const
            verticesRow = [],
            v = iy / heightSegments;

        // special case for the poles
        let uOffset = 0;
        if (iy === 0 && thetaStart === 0)
        {
            uOffset = 0.5 / widthSegments;
        }
        else if (iy === heightSegments && thetaEnd === Math.PI)
        {
            uOffset = -0.5 / widthSegments;
        }

        for (let ix = 0; ix <= widthSegments; ix++)
        {
            const u = ix / widthSegments;

            // vertex
            vertex[0] = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
            vertex[1] = radius * Math.cos(thetaStart + v * thetaLength);
            vertex[2] = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
            vertices.push(vertex[0], vertex[1], vertex[2]);

            // normal
            vec3.copy(normal, vertex);
            vec3.normalize(normal, normal);
            normals.push(normal[0], normal[1], normal[2]);

            // uv
            uvs.push(u + uOffset, 1 - v);
            verticesRow.push(index++);
        }

        grid.push(verticesRow);
    }

    // indices
    for (let iy = 0; iy < heightSegments; iy++)
    {
        for (let ix = 0; ix < widthSegments; ix++)
        {
            const
                a = grid[iy][ix + 1],
                b = grid[iy][ix],
                c = grid[iy + 1][ix],
                d = grid[iy + 1][ix + 1];

            if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
            if (iy !== heightSegments - 1 || thetaEnd < Math.PI) indices.push(b, c, d);
        }
    }

    vec3.unalloc(vertex);
    vec3.unalloc(normal);

    const result = toJSON(indices, vertices, uvs, normals);
    result.shape = {
        factory: createSphere,
        options: {
            radius,
            widthSegments,
            heightSegments,
            phiStart,
            phiLength,
            thetaStart,
            thetaLength
        }
    };

    return result;
}