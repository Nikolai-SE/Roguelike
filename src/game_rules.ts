import { CELL_SIZE } from "./common_constants";
import { Equipment, Helmet, Sword } from "./equipment";
import { Vector, eq, toIndexString } from "./vector";
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

        render(ctx: CanvasRenderingContext2D, pos: Vector): void {
                ctx.fillStyle = this.color;
                ctx.fillRect(pos.x, pos.y, 1 + EPS, 1 + EPS);
        }
}

export const bedrock = new SolidCell(false, '#ffbf7f');
export const wall = new SolidCell(false, '#bfa145');
export const black = new SolidCell(true, '#222222');
export const white = new SolidCell(true, '#ffffff');


export class World {
        readonly updateFrequency: number = 250;
        readonly player: Player;
        readonly units: Unit[] = new Array;
        readonly enemies: Enemy[] = new Array;
        readonly randomizer: SeededRandomUtilities;
        private walls: boolean[][];
        private equipment: Map<String, Equipment>;
        lastUpdate: number = 0;
        turnsCnt: number = 0;
        gameOver: boolean = false;

        constructor(
                generatorSeed: number = -1,
                private width: number = 15,
                private height: number = 15,
        ) {
                if (generatorSeed === -1) {
                        const date = new Date();
                        generatorSeed = date.getTime();
                }
                this.randomizer = new SeededRandomUtilities(generatorSeed.toString());
                this.walls = this.generateWalls();
                const getRandomPosition = new GetRandomPosition(this, width, height, this.randomizer);
                this.player = new Player(this, getRandomPosition.get(), 10, 10, 3);
                const numberEnemies = this.randomizer.getRandomIntegar((width + height) / 2);
                const createrEnemy = new CreateEnemy(this, width, height, this.randomizer);
                for (let i = 0; i < numberEnemies; i++) {
                        this.enemies.push(createrEnemy.get());
                }
                this.units = Object.assign([], this.enemies);
                this.units.push(this.player);
                this.equipment = this.generateEquipment(5);
        }

        private getRandomVector(maxVector: Vector): Vector {
                return {
                        x: this.randomizer.getRandomIntInclusive(maxVector.x),
                        y: this.randomizer.getRandomIntInclusive(maxVector.y),
                };
        }

        private generateWalls(): boolean[][] {
                var walls: boolean[][] = [];
                for (let i = 0; i < this.width; i++) {
                        walls[i] = [];
                        if (i % 2 === 1) {
                                for (let j = 1; j < this.height; j += 2) {
                                        walls[i][j] = true;
                                }
                        }
                }

                for (let i = 1; i < this.height; i += 2) {
                        walls[0][i] = this.randomizer.getRandomBool();
                }

                for (let i = 1; i < this.width; i += 2) {
                        for (let j = 0; j < this.height; j += 2) {
                                walls[i][j] = this.randomizer.getRandomBool();
                        }
                        let k = 0, prev = 0;
                        while (k < this.height) {
                                while (k < this.height && !walls[i - 1][k]) k++;
                                const r = this.randomizer.getRandomIntInclusive(k - 1, prev);
                                walls[i][r - r % 2] = false;
                                prev = k++;
                        }
                }
                return walls;
        }

        // simple equipment generator
        private generateEquipment(numberOfEquipment: number): Map<String, Equipment> {
                const equipment = new Map<String, Equipment>();
                for (let i = 0; i < numberOfEquipment; i++) {
                        let pos = this.getRandomVector({ x: this.width, y: this.height });
                        while (!this.getCellAt(pos).isWalkable || equipment.has(toIndexString(pos)))
                                pos = this.getRandomVector({ x: this.width, y: this.height });

                        if (this.randomizer.getRandomBool()) {
                                equipment.set(toIndexString(pos), new Helmet());
                        } else {
                                equipment.set(toIndexString(pos), new Sword());
                        }
                }
                return equipment;
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

        update(absTime: number, dt: number): void {
                if (absTime - this.lastUpdate > this.updateFrequency) {
                        this.turnsCnt++;
                        for (const u of this.enemies) {
                                u.move();
                        }
                        this.lastUpdate = absTime;
                }
        }

        /**
         * getEquipmentAt
         * @param pos position at world
         * @returns equipment at position of world
         */
        getEquipmentAt(pos: Vector): Equipment | null {
                const equip = this.equipment.get(toIndexString(pos));
                if (equip === undefined) {
                        return null;
                }
                return equip;
        }

        /**
         * getAndRemoveEquipmentAt
         * @param pos position at world
         * @returns equipment at position of world and remove it from collection
         */
        getAndRemoveEquipmentAt(pos: Vector): Equipment | undefined {
                const equip = this.equipment.get(toIndexString(pos));
                if (equip === undefined) {
                        return undefined;
                }
                this.equipment.delete(toIndexString(pos));
                return equip;
        }
}
