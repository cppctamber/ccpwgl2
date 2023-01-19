import { toArray } from "utils";
import { isShapeClockWise, triangulateShape } from "./helpers/misc";
import { toJSON } from "../vertex";


export function createShape(shapes)
{
    shapes = toArray(shapes);

    const
        indices = [],
        positions = [],
        normals = [],
        uvs = [];

    let areaStart = 0,
        areaCount = 0,
        areas = [];

    for (let i = 0; i < shapes.length; i++)
    {
        addShape(shapes[i]);
        addArea(areaStart, areaCount, i);
        areaStart += areaCount;
        areaCount = 0;
    }

    function addArea(start, count, index)
    {
        areas.push({ start, count, index });
    }

    function addShape(shape)
    {
        let shapeVertices = shape.positions,
            shapeHoles = shape.holes || [];

        const indexOffset = positions.length / 3;

        // check direction of positions
        if (isShapeClockWise(shapeVertices) === false)
        {
            shapeVertices = shapeVertices.reverse();
        }

        for (let i = 0, l = shapeHoles.length; i < l; i++)
        {
            const shapeHole = shapeHoles[i];
            if (isShapeClockWise(shapeHole) === true)
            {
                shapeHoles[i] = shapeHole.reverse();
            }
        }

        const faces = triangulateShape(shapeVertices, shapeHoles);

        // join positions of inner and outer paths to a single array
        for (let i = 0, l = shapeHoles.length; i < l; i++)
        {
            const shapeHole = shapeHoles[i];
            shapeVertices = shapeVertices.concat(shapeHole);
        }

        // positions, normals, uvs
        for (let i = 0, l = shapeVertices.length; i < l; i++)
        {
            const vertex = shapeVertices[i];
            positions.push(vertex[0], vertex[1], 0);
            normals.push(0, 0, 1);
            uvs.push(vertex[0], vertex[1]); // world uvs
        }

        // indices
        for (let i = 0, l = faces.length; i < l; i++)
        {
            const
                face = faces[i],
                a = face[0] + indexOffset,
                b = face[1] + indexOffset,
                c = face[2] + indexOffset;

            indices.push(a, b, c);
            areaCount += 3;
        }
    }

    // Normalize
    const result = toJSON(indices, positions, uvs, areas, normals);
    result.factory = createShape;
    result.options = shapes;
    return result;
}
