import { CELL_SIZE } from "./common_constants";
import { Equipment, Helmet, Sword } from "./equipment";
import { Vector, eq, toIndexString } from "./vector";
import SeededRandomUtilities from 'seeded-random-utilities';
import { Player, Unit, Enemy, GetRandomPosition, UnitType } from "./units";

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
        readonly units: Map<UnitType, Unit[]> = new Map();
        readonly randomizer: SeededRandomUtilities = new SeededRandomUtilities();
        private _walls: boolean[][] = new Array();
        private _equipment: Map<String, Equipment> = new Map();
        private _width: number = 0;
        private _height: number = 0;
        lastUpdate: number = 0;
        turnsCnt: number = 0;
        gameOver: boolean = false;

        constructor() {
        }

        set walls(walls: boolean[][]) {
                this._walls = walls;
        }

        set equipment(equipment: Map<String, Equipment>) {
                this._equipment = equipment;
        }

        set boundaries(size: Vector) {
                this._width = size.x;
                this._height = size.y;
        }

        set enemies(enemies: Enemy[]) {
                this.units.set(UnitType.Enemy, enemies);
        }

        set player(player: Player) {
                this.units.set(UnitType.Player, [player]);
        }

        get player(): Player {
                return this.units.get(UnitType.Player)![0] as Player;
        }

        get enemies(): Enemy[] {
                return this.units.get(UnitType.Enemy)! as Enemy[];
        }

        get equipment(): Map<String, Equipment> {
                return this._equipment;
        }

        get boundaries(): Vector {
                return { x: this._width, y: this._height };
        }

        getUnitAt(pos: Vector): Unit | null {
                // Считаем, что юнитов в принципе очень мало в сравнении с клетками
                for (let [_, value] of this.units) {
                        for (const u of value) {
                                if (eq(pos, u.pos)) {
                                        return u;
                                }
                        }
                }
                return null;
        }

        getCellAt(pos: Vector): CellType {
                if (pos.x < 0 || pos.y < 0 || pos.x >= this._width || pos.y >= this._height) {
                        return bedrock;
                } else if (this._walls[pos.x][pos.y]) {
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
                const equip = this._equipment.get(toIndexString(pos));
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
                const equip = this._equipment.get(toIndexString(pos));
                if (equip === undefined) {
                        return undefined;
                }
                this._equipment.delete(toIndexString(pos));
                return equip;
        }
}
