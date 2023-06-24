export interface Rectangle {
        xMin: number;
        xMax: number;
        yMin: number;
        yMax: number;
}

export function eq(a: Rectangle, b: Rectangle): boolean {
        return a.xMin === b.xMin &&
                a.xMax === b.xMax &&
                a.yMin === b.yMin &&
                a.yMax === b.yMax;
}
