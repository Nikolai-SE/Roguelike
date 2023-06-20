import { AbstractEnemyFactory, AggressiveBehaviourState, BehaviourType, CowardBehaviourState, Enemy, EnemyBehaviourState, GetRandomPosition, Player, SimpleEnemyFactory, UnitType } from "./units";
import { Vector, toIndexString } from "./vector";
import { World } from "./game_rules";
import { Equipment } from "./equipment";
import SeededRandomUtilities from "seeded-random-utilities";
import { Helmet, Sword } from "./equipment";
import { PassiveBehaviourState } from "./units";

export { World, CellType } from "./game_rules"

export interface WorldBuilder {
    build(): World;
    reset(): void;
}

export class RandomWorldBuilder implements WorldBuilder {
    private _width: number = 15;
    private _height: number = 15;
    private _randomizer: SeededRandomUtilities = new SeededRandomUtilities();
    private _numberOfEquipment: number = 7;
    private _numberOfEnemies: number = 12;
    private _world: World = new World;
    private _enemyFactory: AbstractEnemyFactory = new SimpleEnemyFactory(this._world);
    private _getRandomPosition: GetRandomPosition | null = null;

    build(): World {
        this.buildSize();
        this.buildWalls();
        this.buildPlayer();
        this.buildEnemies();
        this.buildEquipment();
        return this._world;
    }

    reset(): void {
        this._world = new World();
        this._getRandomPosition = null;
    }

    public set boundaries(boundaries: Vector) {
        this._width = boundaries.x;
        this._height = boundaries.y;
    }

    public set equipmentNumber(numberOfEquipment: number) {
        this._numberOfEquipment = numberOfEquipment;
    }

    public set enemiesNumber(enemiesNumber: number) {
        this._numberOfEnemies = enemiesNumber;
    }

    public set enemySupplier(enemyFactory: AbstractEnemyFactory) {
        this._enemyFactory = enemyFactory;
    }

    public set randomize(randomizer: SeededRandomUtilities) {
        this._randomizer = randomizer;
    }

    private buildSize(): WorldBuilder {
        this._world.boundaries = { x: this._width, y: this._height };
        return this;
    }

    private buildWalls(): WorldBuilder {
        var walls: boolean[][] = [];
        for (let i = 0; i < this._width; i++) {
            walls[i] = [];
            if (i % 2 === 1) {
                for (let j = 1; j < this._height; j += 2) {
                    walls[i][j] = true;
                }
            }
        }

        for (let i = 1; i < this._height; i += 2) {
            walls[0][i] = this._randomizer.getRandomBool();
        }

        for (let i = 1; i < this._width; i += 2) {
            for (let j = 0; j < this._height; j += 2) {
                walls[i][j] = this._randomizer.getRandomBool();
            }
            let k = 0, prev = 0;
            while (k < this._height) {
                while (k < this._height && !walls[i - 1][k]) k++;
                const r = this._randomizer.getRandomIntInclusive(k - 1, prev);
                walls[i][r - r % 2] = false;
                prev = k++;
            }
        }
        this._world.walls = walls;
        return this;
    }

    private buildEnemies(): WorldBuilder {
        this._getRandomPosition = this._getRandomPosition == null ? new GetRandomPosition(this._world, this._width, this._height, this._randomizer) : this._getRandomPosition;
        this._world.enemies = [];

        for (let i = 0; i < this._numberOfEnemies; i++) {
            const randomPosition: Vector = this._getRandomPosition.get();
            let enemy: Enemy;
            switch (this._randomizer.getRandomIntegar(7, 1)) {
                case 1:
                    enemy = this._enemyFactory.createEasyEnemy(randomPosition);
                    break;
                case 2:
                    enemy = this._enemyFactory.createMediumEnemy(randomPosition);
                    break;
                case 3:
                    enemy = this._enemyFactory.createHardEnemy(randomPosition);
                    break;
                case 4:
                    enemy = this._enemyFactory.createEasySlime(randomPosition);
                    break;
                case 5:
                    enemy = this._enemyFactory.createMediumSlime(randomPosition);
                    break;
                case 6:
                    enemy = this._enemyFactory.createHardSlime(randomPosition);
                    break;
                default:
                    throw new Error("how did you get here?");
            }
            this._world.enemies.push(enemy);
        }
        return this;
    }

    private buildEquipment(): WorldBuilder {
        const equipment = new Map<String, Equipment>();
        for (let i = 0; i < this._numberOfEquipment; i++) {
            let pos = this.getRandomVector({ x: this._width, y: this._height });
            while (!this._world.getCellAt(pos).isWalkable || equipment.has(toIndexString(pos)))
                pos = this.getRandomVector({ x: this._width, y: this._height });

            if (this._randomizer.getRandomBool()) {
                equipment.set(toIndexString(pos), new Helmet());
            } else {
                equipment.set(toIndexString(pos), new Sword());
            }
        }
        this._world.equipment = equipment;
        return this;
    }

    private buildPlayer(): WorldBuilder {
        this._getRandomPosition = this._getRandomPosition == null ? new GetRandomPosition(this._world, this._width, this._height, this._randomizer) : this._getRandomPosition;
        this._world.player = new Player(this._world, this._getRandomPosition.get(), 10, 10, 3);
        return this;
    }

    private getRandomVector(maxVector: Vector): Vector {
        return {
            x: this._randomizer.getRandomIntInclusive(maxVector.x),
            y: this._randomizer.getRandomIntInclusive(maxVector.y),
        };
    }
}

export class MockWorldBuilder implements WorldBuilder {
    private _world: World = new World;

    constructor(
    ) {
    }

    build(): World {
        return this._world!;
    }

    reset(): void {
        this._world = new World();
    }

    public set boundaries(boundaries: Vector) {
        this._world.boundaries = boundaries;
    }

    public set walls(walls: boolean[][]) {
        this._world.walls = walls;
    }

    public set player(player: Player) {
        this._world.player = player;
    }

    public set enemies(enemies: Enemy[]) {
        this._world.enemies = enemies;
    }

    public set equipment(equipment: Map<String, Equipment>) {
        this._world.equipment = equipment;
    }
}

export class UnitRecord {
    pos!: Vector;
    hp!: number;
    maxHp!: number;
    damage!: number;
}

export class EnemyRecord extends UnitRecord {
    behaviour!: BehaviourType;
}

export class WorldRecord {
    public size!: Vector;
    public walls!: Vector[];
    public player!: UnitRecord;
    public enemies!: EnemyRecord[];
    public equipment!: Map<String, String>;
}

export class StringWorldBuilder implements WorldBuilder {
    private _world: World = new World;
    private _worldRecord: WorldRecord = new WorldRecord;

    build(): World {
        this.buildSize();
        this.buildWalls();
        this.buildPlayer();
        this.buildEnemies();
        this.buildEquipment();
        return this._world;
    }

    reset(): void {
        this._world = new World;
        this._worldRecord = new WorldRecord;
    }

    public set source(source: string) {
        this._worldRecord = JSON.parse(source);
    }

    private buildSize(): WorldBuilder {
        this._world.boundaries = this._worldRecord.size;
        return this;
    }

    private buildWalls(): WorldBuilder {
        var wallPositions: Vector[] = this._worldRecord.walls;
        var walls: boolean[][] = new Array(this._world.boundaries.x)
            .fill(false)
            .map(() =>
                new Array(this._world.boundaries.y).fill(false)
            );

        wallPositions.forEach((pos: Vector) => walls[pos.x][pos.y] = true);
        this._world.walls = walls;

        return this;
    }

    private buildPlayer(): WorldBuilder {
        this._world.player = new Player(this._world,
            this._worldRecord.player.pos,
            this._worldRecord.player.hp,
            this._worldRecord.player.maxHp,
            this._worldRecord.player.damage);

        return this;
    }

    private static getBehaviour(type: BehaviourType): EnemyBehaviourState {
        switch (type) {
            case BehaviourType.AGGRESSIVE:
                return new AggressiveBehaviourState;
            case BehaviourType.COWARD:
                return new CowardBehaviourState;
            case BehaviourType.PASSIVE:
                return new PassiveBehaviourState;
        }
    }

    private buildEnemies(): WorldBuilder {
        var enemies: Enemy[] = [];
        this._worldRecord.enemies.forEach(
            (enemy: EnemyRecord) => enemies.push(new Enemy(this._world,
                enemy.pos, StringWorldBuilder.getBehaviour(enemy.behaviour),
                enemy.hp,
                enemy.maxHp,
                enemy.damage)));
        this._world.enemies = enemies;

        return this;
    }

    private buildEquipment(): WorldBuilder {
        let equipment: Map<String, Equipment> = new Map;
        for (let [key, value] of this._worldRecord.equipment) {
            equipment.set(key, value == "Sword" ? new Sword : new Helmet);
        }
        this._world.equipment = equipment;
        return this;
    }
}
