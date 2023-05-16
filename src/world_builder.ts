import { AbstractEnemyFactory, Enemy, GetRandomPosition, Player, SimpleEnemyFactory, UnitType } from "./units";
import { Vector, toIndexString } from "./vector";
import { World } from "./game_rules";
import { Equipment } from "./equipment";
import SeededRandomUtilities from "seeded-random-utilities";
import { Helmet, Sword } from "./equipment";

export { World, CellType } from "./game_rules"

export interface WorldBuilder {
    buildSize(): WorldBuilder;

    buildWalls(): WorldBuilder;

    buildEnemies(): WorldBuilder;

    buildEquipment(): WorldBuilder;

    buildPlayer(): WorldBuilder;

    getResult(): World;
}

export class RandomWorldBuilder implements WorldBuilder {
    private width: number;
    private height: number;
    private randomizer: SeededRandomUtilities;
    private numberOfEquipment: number;
    private numberOfEnemies: number;
    private world: World;
    private enemyFactory: AbstractEnemyFactory;
    private getRandomPosition: GetRandomPosition;

    constructor(
        width: number = 15,
        height: number = 15,
        numberOfEquipment: number = 7,
        numberOfEnemies: number | undefined = undefined,
        randomizer: SeededRandomUtilities = new SeededRandomUtilities(),
        enemyFactory: AbstractEnemyFactory | undefined = undefined
    ) {
        this.world = new World();
        this.width = width;
        this.height = height;
        this.randomizer = randomizer;
        this.numberOfEquipment = numberOfEquipment;
        this.enemyFactory = enemyFactory == undefined ? new SimpleEnemyFactory(this.world) : enemyFactory;
        this.numberOfEnemies = numberOfEnemies == undefined ? randomizer.getRandomIntegar(15, 7) : numberOfEnemies;
        this.getRandomPosition = new GetRandomPosition(this.world, this.width, this.height, this.randomizer);
    }

    buildSize(): WorldBuilder {
        this.world.boundaries = { x: this.width, y: this.height };
        return this;
    }

    buildWalls(): WorldBuilder {
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
        this.world.walls = walls;
        return this;
    }

    buildEnemies(): WorldBuilder {
        this.world.enemies = [];

        for (let i = 0; i < this.numberOfEnemies; i++) {
            const randomPosition: Vector = this.getRandomPosition.get();
            let enemy: Enemy;
            switch (this.randomizer.getRandomIntegar(3, 1)) {
                case 1:
                    enemy = this.enemyFactory.createEasyEnemy(randomPosition);
                    break;
                case 2:
                    enemy = this.enemyFactory.createMediumEnemy(randomPosition);
                    break;
                case 3:
                    enemy = this.enemyFactory.createHardEnemy(randomPosition);
                    break;
                default:
                    throw new Error("how did you get here?");
            }
            this.world.enemies.push(enemy);
        }
        return this;
    }

    buildEquipment(): WorldBuilder {
        const equipment = new Map<String, Equipment>();
        for (let i = 0; i < this.numberOfEquipment; i++) {
            let pos = this.getRandomVector({ x: this.width, y: this.height });
            while (!this.world.getCellAt(pos).isWalkable || equipment.has(toIndexString(pos)))
                pos = this.getRandomVector({ x: this.width, y: this.height });

            if (this.randomizer.getRandomBool()) {
                equipment.set(toIndexString(pos), new Helmet());
            } else {
                equipment.set(toIndexString(pos), new Sword());
            }
        }
        this.world.equipment = equipment;
        return this;
    }

    buildPlayer(): WorldBuilder {
        this.world.player = new Player(this.world, this.getRandomPosition.get(), 10, 10, 3);
        return this;
    }

    getResult(): World {
        return this.world;
    }

    private getRandomVector(maxVector: Vector): Vector {
        return {
            x: this.randomizer.getRandomIntInclusive(maxVector.x),
            y: this.randomizer.getRandomIntInclusive(maxVector.y),
        };
    }
}