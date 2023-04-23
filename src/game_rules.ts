import { CELL_SIZE } from "./common_constants";
import { Vector, add, eq } from "./vector";

export interface CellType {
        isWalkable: boolean,
        render(ctx: CanvasRenderingContext2D, pos: Vector): void
}

const EPS = 1 / CELL_SIZE;

class SolidCell {
        constructor(
                readonly isWalkable: boolean,
                private readonly color: string,
        ) { }

        render(ctx: CanvasRenderingContext2D, pos: Vector) {
                ctx.fillStyle = this.color;
                ctx.fillRect(pos.x, pos.y, 1 + EPS, 1 + EPS);
        }
}

const bedrock = new SolidCell(false, '#ffbf7f');
const black = new SolidCell(true, '#222222');
const white = new SolidCell(true, '#ffffff');

export class Unit {
        constructor(
                readonly world: World,
                private _pos: Vector,
        ) { }

        get pos(): Vector {
                return {
                        x: this._pos.x,
                        y: this._pos.y,
                };
        }

        tryMoveTo(pos: Vector): boolean {
                const walkable = this.world.getCellAt(pos).isWalkable;
                if (!walkable) {
                        return false;
                }
                this._pos.x = pos.x;
                this._pos.y = pos.y;
                return true;
        }

        render(ctx: CanvasRenderingContext2D) {
                ctx.fillStyle = '#7fbfff';
        }
}

export class Player extends Unit {
        constructor(
                world: World,
                pos: Vector,
                public hp: number,
                public maxHp: number,
                public damage: number,
        ) {
                super(world, pos);
        }

        tryWalk(delta: Vector): boolean {
                if (delta.x * delta.y != 0 || Math.abs(delta.x) + Math.abs(delta.y) != 1) {
                        return false;
                }
                return this.tryMoveTo(add(this.pos, delta));
        }

        render(ctx: CanvasRenderingContext2D) {
                ctx.fillStyle = '#7fbfff';
                ctx.beginPath();
                ctx.arc(this.pos.x + 0.5, this.pos.y + 0.5, 0.3, 0, 2 * Math.PI);
                ctx.fill();
                ctx.closePath();
        }
}

const width = 10
const height = 10

export class World {
        readonly player = new Player(this, { x: 4, y: 4 }, 10, 10, 3);
        readonly units: Unit[] = [this.player];

        getUnitAt(pos: Vector): Unit | null {
                // Считаем, что юнитов в принципе очень мало в сравнении с клетками
                for (const u of this.units) {
                        if (eq(pos, u.pos)) {
                                return u;
                        }
                }
                return null;
        }

        getCellAt(pos: Vector): CellType {
                if (pos.x < 0 || pos.y < 0 || pos.x >= width || pos.y >= height) {
                        return bedrock;
                } else if ((pos.x + pos.y) % 2 === 0) {
                        return black;
                } else {
                        return white;
                }
        }
}

export class Cell {
        public leftUp: SolidCell
        public rightUp: SolidCell
        public rightDown: SolidCell
        public leftDown: SolidCell
        constructor(
                leftUp: SolidCell,
                rightUp: SolidCell,
                rightDown: SolidCell,
                leftDown: SolidCell
        ) {
                this.leftUp = leftUp
                this.rightUp = rightUp
                this.rightDown = rightDown
                this.leftDown = leftDown
        }
}

class Map {
        public cells: Cell[][];
        constructor(width: number, height: number) {
                this.cells = []
                this.cells[0] = []
                this.cells[0][0] = new Cell(bedrock, bedrock, white, bedrock);
                for (let j: number = 0; j < width; j++) {
                        this.cells[0][j] = new Cell(bedrock, bedrock, white, white);
                }
                this.cells[0][width - 1] = new Cell(bedrock, bedrock, bedrock, white);
                for (let i: number = 1; i < height; i++) {
                        this.cells[i] = []
                        this.cells[i][0] = new Cell(bedrock, white, white, bedrock)
                        for (let j: number = 1; j < width - 1; j++) {
                                this.cells[i][j] = new Cell(bedrock, white, white, white)
                        }
                        this.cells[i][width - 1] = new Cell(bedrock, bedrock, bedrock, white)
                }
        }
}

let map = new Map(width, height)
console.log(map)

export class GenerateWorld {

}
