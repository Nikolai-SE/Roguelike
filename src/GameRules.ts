import { CELL_SIZE, Vector, add, eq } from "./Commons";

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

export class World {
        readonly player = new Player(this, { x: 4, y: 4 });
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
                if (pos.x < 0 || pos.y < 0 || pos.x >= 10 || pos.y >= 10) {
                        return bedrock;
                } else if ((pos.x + pos.y) % 2 === 0) {
                        return black;
                } else {
                        return white;
                }
        }
}
