import { CELL_SIZE } from "./common_constants";
import { Vector, add, eq, sub } from "./vector";
import SeededRandomUtilities from 'seeded-random-utilities';
import { Player, Unit, Enemy, CreateEnemy, GetRandomPosition } from "./units";

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

export const bedrock = new SolidCell(false, '#ffbf7f');
export const wall = new SolidCell(false, '#bfa145');
export const black = new SolidCell(true, '#222222');
export const white = new SolidCell(true, '#ffffff');


export class World {
        readonly updateFrequency: number = 250
        readonly player: Player;
        readonly units: Unit[] = new Array;
        readonly enemies: Enemy[] = new Array;
        readonly randomizer: SeededRandomUtilities;
        private walls: boolean[][];
        public lastUpdate: number = 0;
        public turnsCnt: number = 0;

        constructor(
                generator_seed: number = -1,
                private width = 15,
                private height = 15
        ) {
                if (generator_seed == -1) {
                        const date_ = new Date();
                        generator_seed = date_.getTime();
                }
                this.randomizer = new SeededRandomUtilities(generator_seed.toString());
                this.walls = this.generate_walls();
                const getRandomPosition = new GetRandomPosition(this.walls, this.randomizer)
                this.player = new Player(this, getRandomPosition.get(), 10, 10, 3);
                const numberEnemies = this.randomizer.getRandomIntegar((width + height) / 2);
                const createrEnemy = new CreateEnemy(this, this.walls, this.randomizer);
                for (let i = 0; i < numberEnemies; i++) {
                        this.enemies.push(createrEnemy.get());
                }
                this.units = Object.assign([], this.enemies)
                this.units.push(this.player)
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
                for (const u of this.enemies) {
                        if (eq(pos, u.pos)) {
                                return u;
                        }
                }
                if (eq(this.player.pos, pos)) {
                        return this.player
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

        update(absTime: number, dt: number) {
                if (absTime - this.lastUpdate > this.updateFrequency) {
                        for (const u of this.enemies) {
                                u.move(absTime)
                        }
                        this.lastUpdate = absTime
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
                for (const u of this.enemies) {
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
