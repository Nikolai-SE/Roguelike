import { CELL_SIZE } from "./common_constants";
import { Vector, add, eq } from "./vector";
import SeededRandomUtilities from 'seeded-random-utilities';

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
const wall = new SolidCell(false, '#bfa145');
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

export class World {
        readonly player: Player;
        readonly units: Unit[];
        private randomizer: SeededRandomUtilities;
        private walls: boolean[][];

        constructor(
                generator_seed: number = -1,
                private width = 20,
                private height = 20
        ) {
                if (generator_seed == -1) {
                        const date_ = new Date();
                        generator_seed = date_.getTime();
                }
                this.randomizer = new SeededRandomUtilities(generator_seed.toString());
                this.walls = this.generate_walls();
                this.player = new Player(this, giveAllowedPosition(this.walls), 10, 10, 3)
                this.units = [this.player]
        }

        private generate_walls(): boolean[][] {
                var walls: boolean[][] = [];
                for (let i = 0; i < this.width; i++) {
                        walls[i] = []
                        if (i % 2 === 1)
                                for (let j = 1; j < this.height; j += 2)
                                        walls[i][j] = true;
                }

                for (let i = 1; i < this.height; i += 2)
                        walls[0][i] = this.randomizer.getRandomBool();

                for (let i = 1; i < this.width; i += 2) {
                        for (let j = 0; j < this.height; j += 2) {
                                walls[i][j] = this.randomizer.getRandomBool();
                        }
                        let k = 0, prev = 0;
                        while (k < this.height) {
                                while (k < this.height && !walls[i - 1][k]) k++;
                                let r = this.randomizer.getRandomIntInclusive(k - 1, prev);
                                walls[i][r - r % 2] = false;
                                prev = k++;
                        }
                }
                return walls;
        }

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
                if (pos.x < 0 || pos.y < 0 || pos.x >= this.width || pos.y >= this.height) {
                        return bedrock;
                } else if (this.walls[pos.x][pos.y]) {
                        return wall;
                } else {
                        return white;
                }
        }
}


export class WorldMock extends World {
        private widthMock = 15;
        private heightMock = 15;

        constructor(
        ) {
                super(0, 0, 0);
        }

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
                if (pos.x < 0 || pos.y < 0 || pos.x >= this.widthMock || pos.y >= this.heightMock) {
                        return bedrock;
                } else if ((pos.x + pos.y) % 4 === 2) {
                        return wall;
                } else {
                        return white;
                }
        }
}

function giveAllowedPosition(walls: boolean[][]): Vector {
        if (!walls[0]) {
                return { x: 0, y: 0 }
        }
        const maxX = walls.length
        const maxY = walls[0].length
        let x, y
        do {
                x = Math.floor(Math.random() * maxX)
                y = Math.floor(Math.random() * maxY)
        } while (walls[x][y])
        return { x: x, y: y }
}