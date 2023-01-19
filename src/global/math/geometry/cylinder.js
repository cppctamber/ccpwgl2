import { vec3 } from "../vec3";
import { vec2 } from "../vec2";
import { toJSON } from "../vertex";


export function createCylinder(options = {})
{
    let {
        radiusTop = 1,
        radiusBottom = 1,
        height = 1,
        radialSegments = 32,
        heightSegments = 1,
        openEnded = false,
        thetaStart = 0,
        thetaLength = Math.PI * 2
    } = options;

    radialSegments = Math.floor(radialSegments);
    heightSegments = Math.floor(heightSegments);

    // buffers
    const
        indices = [],
        positions = [],
        normals = [],
        uvs = [];

    // helper variables
    let index = 0;

    const
        indexArray = [],
        halfHeight = height / 2;

    // build geometry
    function generateTorso()
    {
        const
            normal = vec3.alloc(),
            vertex = vec3.alloc();

        // this will be used to calculate the normal
        const slope = (radiusBottom - radiusTop) / height;

        // generate positions, normals and uvs

        for (let y = 0; y <= heightSegments; y++)
        {
            const
                indexRow = [],
                v = y / heightSegments;

            // calculate the radius of the current row
            const radius = v * (radiusBottom - radiusTop) + radiusTop;
            for (let x = 0; x <= radialSegments; x++)
            {
                const
                    u = x / radialSegments,
                    theta = u * thetaLength + thetaStart,
                    sinTheta = Math.sin(theta),
                    cosTheta = Math.cos(theta);

                // vertex
                vertex[0] = radius * sinTheta;
                vertex[1] = -v * height + halfHeight;
                vertex[2] = radius * cosTheta;
                positions.push(vertex[0], vertex[1], vertex[2]);

                // normal
                normal[0] = sinTheta;
                normal[1] = slope;
                normal[2] = cosTheta;
                vec3.normalize(normal, normal);
                normals.push(normal[0], normal[1], normal[2]);

                // uv
                uvs.push(u, 1 - v);

                // save index of vertex in respective row
                indexRow.push(index++);
            }

            // now save positions of the row in our index array
            indexArray.push(indexRow);
        }

        vec3.unalloc(vertex);
        vec3.unalloc(normal);

        // generate indices
        for (let x = 0; x < radialSegments; x++)
        {
            for (let y = 0; y < heightSegments; y++)
            {
                // we use the index array to access the correct indices
                const
                    a = indexArray[y][x],
                    b = indexArray[y + 1][x],
                    c = indexArray[y + 1][x + 1],
                    d = indexArray[y][x + 1];

                // faces
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }
    }

    function generateCap(top)
    {

        // save the index of the first center vertex
        const centerIndexStart = index;

        const
            uv = vec2.alloc(),
            vertex = vec3.alloc(),
            radius = (top === true) ? radiusTop : radiusBottom,
            sign = (top === true) ? 1 : -1;

        // first we generate the center vertex data of the cap.
        // because the geometry needs one set of uvs per face,
        // we must generate a center vertex per face/segment

        for (let x = 1; x <= radialSegments; x++)
        {
            // vertex
            positions.push(0, halfHeight * sign, 0);

            // normal
            normals.push(0, sign, 0);

            // uv
            uvs.push(0.5, 0.5);

            // increase index
            index++;
        }

        // save the index of the last center vertex
        const centerIndexEnd = index;

        // now we generate the surrounding positions, normals and uvs

        for (let x = 0; x <= radialSegments; x++)
        {
            const
                u = x / radialSegments,
                theta = u * thetaLength + thetaStart,
                cosTheta = Math.cos(theta),
                sinTheta = Math.sin(theta);

            // vertex
            vertex[0] = radius * sinTheta;
            vertex[1] = halfHeight * sign;
            vertex[2] = radius * cosTheta;
            positions.push(vertex[0], vertex[1], vertex[2]);

            // normal
            normals.push(0, sign, 0);

            // uv
            uv[0] = (cosTheta * 0.5) + 0.5;
            uv[1] = (sinTheta * 0.5 * sign) + 0.5;
            uvs.push(uv[0], uv[1]);

            // increase index
            index++;
        }

        vec2.unalloc(uv);
        vec3.unalloc(vertex);

        // generate indices
        for (let x = 0; x < radialSegments; x++)
        {
            const
                c = centerIndexStart + x,
                i = centerIndexEnd + x;

            if (top === true)
            {
                // face top
                indices.push(i, i + 1, c);
            }
            else
            {
                // face bottom
                indices.push(i + 1, i, c);
            }
        }
    }

    // generate geometry
    generateTorso();

    if (openEnded === false)
    {
        if (radiusTop > 0) generateCap(true);
        if (radiusBottom > 0) generateCap(false);
    }

    const result = toJSON(indices, positions, uvs, normals);
    result.factory = createCylinder;
    result.options = {
        radiusTop,
        radiusBottom,
        height,
        radialSegments,
        heightSegments,
        openEnded,
        thetaStart,
        thetaLength
    };
    return result;
}

export function createCone(options={})
{
    const { radius = 1 } = options;
    const result = createCylinder(Object.assign({}, options, {
        radiusTop: 0,
        radiusBottom: radius
    }));
    result.factory = createCone;
    Reflect.deleteProperty(result.options, "radiusTop");
    Reflect.deleteProperty(result.options, "radiusBottom");
    result.options.radius = radius;
    return result;
}