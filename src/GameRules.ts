import { CELL_SIZE, Vector } from "./Commons";

export interface CellType {
        isWalkable: () => boolean,
        render: (ctx: CanvasRenderingContext2D, pos: Vector) => void
}

const EPS = 1 / CELL_SIZE;

const bedrock = {
        isWalkable: () => false,
        render: (ctx: CanvasRenderingContext2D, pos: Vector) => {
                ctx.fillStyle = '#ffc080';
                ctx.fillRect(pos.x, pos.y, 1 + EPS, 1 + EPS);
        },
};

const black = {
        isWalkable: () => true,
        render: (ctx: CanvasRenderingContext2D, pos: Vector) => {
                ctx.fillStyle = '#222222';
                ctx.fillRect(pos.x, pos.y, 1 + EPS, 1 + EPS);
        },
};

const snow = {
        isWalkable: () => true,
        render: (ctx: CanvasRenderingContext2D, pos: Vector) => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(pos.x, pos.y, 1 + EPS, 1 + EPS);
        },
};

export class Unit {
}

export class World {
        constructor() {
        }

        getCellAt(pos: Vector): CellType {
                if (pos.x < 0 || pos.y < 0 || pos.x >= 10 || pos.y >= 10) {
                        return bedrock;
                }
                if ((pos.x + pos.y) % 2 == 0) {
                        return black;
                } else {
                        return snow;
                }
        }
}
