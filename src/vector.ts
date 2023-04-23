export interface Vector {
        x: number;
        y: number;
}

export function eq(v: Vector, u: Vector): boolean {
        return v.x === u.x && v.y === u.y;
}

export function add(v: Vector, u: Vector): Vector {
        return {
                x: v.x + u.x,
                y: v.y + u.y,
        };
}

export function sub(v: Vector, u: Vector): Vector {
        return {
                x: v.x - u.x,
                y: v.y - u.y,
        };
}

export function mul(k: number, v: Vector): Vector {
        return {
                x: k * v.x,
                y: k * v.y,
        };
}

export function div(v: Vector, k: number): Vector {
        return {
                x: v.x / k,
                y: v.y / k,
        };
}
