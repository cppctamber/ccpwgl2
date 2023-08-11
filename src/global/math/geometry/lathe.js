import { vec2, vec3, num } from "math";
import { toJSON } from "math/vertex";

/**
 * Creates a lathe
 * @author Three.js converted
 **/
export function createLathe(options)
{
    let {
        points = [
            vec2.fromValues(0, -0.5),
            vec2.fromValues(0.5, 0),
            vec2.fromValues(0, 0.5)
        ],
        segments = 12,
        phiStart = 0,
        phiLength = Math.PI * 2
    } = options;

    segments = Math.floor(segments);

    // clamp phiLength so it's in range of [ 0, 2PI ]
    phiLength = num.clamp(phiLength, 0, Math.PI * 2);

    // buffers
    const
        indices = [],
        positions = [],
        uvs = [],
        initNormals = [],
        normals = [];

    // helper variables
    const
        inverseSegments = 1.0 / segments,
        uv = vec2.alloc(),
        vertex = vec3.alloc(),
        normal = vec3.alloc(),
        curNormal = vec3.alloc(),
        prevNormal = vec3.alloc();

    let dx = 0,
        dy = 0;

    // pre-compute normals for initial "meridian"
    for (let j = 0; j <= (points.length - 1); j++)
    {
        switch (j)
        {
            case 0:				// special handling for 1st vertex on path
                dx = points[j + 1][0] - points[j][0];
                dy = points[j + 1][1] - points[j][1];

                normal[0] = dy * 1.0;
                normal[1] = -dx;
                normal[2] = dy * 0.0;

                vec3.copy(prevNormal, normal);
                vec3.normalize(normal, normal);
                initNormals.push(normal[0], normal[1], normal[2]);
                break;

            case (points.length - 1):	// special handling for last Vertex on path
                initNormals.push(prevNormal[0], prevNormal[1], prevNormal[2]);
                break;

            default:			// default handling for all positions in between
                dx = points[j + 1][0] - points[j][0];
                dy = points[j + 1][1] - points[j][1];

                normal[0] = dy * 1.0;
                normal[1] = -dx;
                normal[2] = dy * 0.0;
                vec3.copy(curNormal, normal);

                normal[0] += prevNormal[0];
                normal[1] += prevNormal[1];
                normal[2] += prevNormal[2];
                vec3.normalize(normal, normal);

                initNormals.push(normal[0], normal[1], normal[2]);
                vec3.copy(prevNormal, curNormal);
        }
    }

    // generate positions, uvs and normals
    for (let i = 0; i <= segments; i++)
    {
        const
            phi = phiStart + i * inverseSegments * phiLength,
            sin = Math.sin(phi),
            cos = Math.cos(phi);

        for (let j = 0; j <= (points.length - 1); j++)
        {
            // vertex
            positions.push(
                points[j][0] * sin,
                points[j][1],
                points[j][0] * cos
            );
            // uv
            uvs.push(
                i / segments,
                j / (points.length - 1)
            );
            // normal
            normals.push(
                initNormals[3 * j + 0] * sin,
                initNormals[3 * j + 1],
                initNormals[3 * j + 0] * cos
            );
        }
    }

    vec2.unalloc(uv);
    vec3.unalloc(vertex);
    vec3.unalloc(normal);
    vec3.unalloc(curNormal);
    vec3.unalloc(prevNormal);

    // indices
    for (let i = 0; i < segments; i++)
    {
        for (let j = 0; j < (points.length - 1); j++)
        {
            const
                base = j + i * points.length,
                a = base,
                b = base + points.length,
                c = base + points.length + 1,
                d = base + 1;

            // faces
            indices.push(a, b, d);
            indices.push(c, d, b);
        }
    }

    const result = toJSON(indices, positions, uvs, normals);
    result.factory = createLathe;
    result.options = {
        points,
        segments,
        phiStart,
        phiLength,
    };
    return result;
}
