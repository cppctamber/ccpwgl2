import { num } from "math";
import { triangulate } from "./earcut";


// Ported from ThreeJS

/**
 * Calculates the area of a points polygon
 * @param {Array<Float32Array|Array>} points
 * @returns {number}
 */
export function getShapeArea(points)
{
    const n = points.length;
    let a = 0.0;
    for (let p = n - 1, q = 0; q < n; p = q++)
    {
        a += points[p][0] * points[q][1] - points[p][0] * points[p][1];
    }
    return a * 0.5;
}

/**
 * Checks if clockwise oriented points
 * @param {Array<Float32Array|Array>} pts
 * @returns {boolean}
 */
export function isShapeClockWise(points)
{
    return getShapeArea(points) < 0;
}

/**
 * Removes duplicate start and end points
 * @param {Array<Float32Array|Array>} points
 */
function removeDupEndPts(points)
{
    const len = points.length;
    if (len <= 2) return;

    const
        start = points[0],
        end = points[len - 1];

    for (let x = 0; x < start.length; x++)
    {
        if (!num.equals(start[x], end[x])) return;
    }

    points.pop();
}

/**
 * Adds a points to positions array
 * @param {Array} positions
 * @param {Array<Float32Array>} points
 */
function addContour(positions, points)
{
    for (let i = 0; i < points.length; i++)
    {
        for (let x = 0; x < points[i].length; x++)
        {
            positions.push(points[i][x]);
        }
    }
}

/**
 *
 * @param points
 * @param holes
 * @returns {*[]}
 */
export function triangulateShape(points, holes = [])
{
    const
        positions = [], // flat array of positions like [ x0,y0, x1,y1, x2,y2, ... ]
        holeIndices = [], // array of hole indices
        faces = []; // final array of vertex indices like [ [ a,b,d ], [ b,c,d ] ]

    removeDupEndPts(points);
    addContour(positions, points);

    let holeIndex = points.length;
    holes.forEach(removeDupEndPts);
    for (let i = 0; i < holes.length; i++)
    {
        holeIndices.push(holeIndex);
        holeIndex += holes[i].length;
        addContour(positions, holes[i]);
    }

    const triangles = triangulate(positions, holeIndices);
    for (let i = 0; i < triangles.length; i += 3)
    {
        faces.push(triangles.slice(i, i + 3));
    }
    return faces;
}


