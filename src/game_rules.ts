import { CELL_SIZE } from "./common_constants";
import { Vector, add, eq, sub } from "./vector";
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

function canSee(unit1: Unit, unit2: Unit): boolean {
        const subtracktedPosition = sub(unit1.pos, unit2.pos)
        if (subtracktedPosition.x != 0 && subtracktedPosition.y != 0) {
                return false;
        }

        if (subtracktedPosition.x == 0) {
                const x = unit1.pos.x
                const leftCol = Math.min(unit1.pos.y, unit2.pos.y)
                const rightCol = Math.max(unit1.pos.y, unit2.pos.y)
                for (let y = leftCol + 1; y < rightCol; y++) {
                        if (unit1.world.getCellAt({ x, y }) != white) {
                                return false
                        }
                }
        }

        if (subtracktedPosition.y == 0) {
                const y = unit1.pos.y
                const leftRow = Math.min(unit1.pos.x, unit2.pos.x)
                const rightRow = Math.max(unit1.pos.x, unit2.pos.x)
                for (let x = leftRow + 1; x < rightRow; x++) {
                        if (unit1.world.getCellAt({ x, y }) != white) {
                                return false
                        }
                }
        }

        return true;
}

export abstract class EnemyBehaviour {
        wasAttacked: boolean = false

        moveTowardsThePlayer(player: Player, enemy: Enemy): Vector {
                if (player.pos.x == enemy.pos.x) {
                        return { x: 0, y: player.pos.y > enemy.pos.y ? 1 : -1 }
                }
                if (player.pos.y == enemy.pos.y) {
                        return { x: player.pos.x > enemy.pos.x ? 1 : -1, y: 0 }
                }
                return { x: 0, y: 0 }
        }

        moveFromThePlayer(player: Player, enemy: Enemy): Vector {
                if (player.pos.x == enemy.pos.x) {
                        return { x: 0, y: player.pos.y > enemy.pos.y ? -1 : 1 }
                }
                if (player.pos.y == enemy.pos.y) {
                        return { x: player.pos.x > enemy.pos.x ? -1 : 1, y: 0 }
                }
                return { x: 0, y: 0 }
        }

        moveOnPlace(enemy: Enemy) {
                return { x: 0, y: 0 }
        }

        moveRandom(enemy: Enemy) {
                return { x: 0, y: 0 } //TODO: move random lol
        }

        abstract move(player: Player, enemy: Enemy): void
}

export class PassiveBehaviour extends EnemyBehaviour {
        move(player: Player, enemy: Enemy): void {
                if (this.wasAttacked) {
                        if (canSee(player, enemy)) {
                                enemy.tryWalk(this.moveTowardsThePlayer(player, enemy))
                        } else {
                                enemy.tryWalk(this.moveRandom(enemy))
                        }
                }
        }
}

export class AggressiveBehaviour extends EnemyBehaviour {
        move(player: Player, enemy: Enemy): void {
                if (canSee(player, enemy)) {
                        enemy.tryWalk(this.moveTowardsThePlayer(player, enemy))
                } else {
                        enemy.tryWalk(this.moveRandom(enemy))
                }
        }
}

export class CowardBehaviour extends EnemyBehaviour {
        move(player: Player, enemy: Enemy): void {
                if (canSee(player, enemy)) {
                        enemy.tryWalk(this.moveFromThePlayer(player, enemy))
                } else {
                        enemy.tryWalk(this.moveRandom(enemy))
                }
        }
}

export class Enemy extends Unit {
        behaviour: EnemyBehaviour
        constructor(
                world: World,
                pos: Vector,
                behaviour: EnemyBehaviour,
                public hp: number,
                public maxHp: number,
                public damage: number,
        ) {
                super(world, pos);
                this.behaviour = behaviour
        }

        move(): void {
                this.behaviour.move(this.world.player, this)
        }

        tryWalk(delta: Vector): boolean {
                if (delta.x * delta.y != 0 || Math.abs(delta.x) + Math.abs(delta.y) != 1) {
                        return false;
                }
                return this.tryMoveTo(add(this.pos, delta));
        }

        render(ctx: CanvasRenderingContext2D) {
                ctx.fillStyle = '#000000';
                if (canSee(this, this.world.player)) {
                        ctx.fillStyle = '#ff0000'
                } // TODO: delete later
                ctx.beginPath();
                ctx.arc(this.pos.x + 0.5, this.pos.y + 0.5, 0.3, 0, 2 * Math.PI);
                ctx.fill();
                ctx.closePath();
        }
}


export class World {
        readonly updateFrequency: number = 250
        readonly player: Player;
        readonly enemies: Enemy[] = new Array;
        private randomizer: SeededRandomUtilities;
        private walls: boolean[][];
        private lastUpdate: number = 0

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
                this.player = new Player(this, giveAllowedPosition(this.walls), 10, 10, 3)
                const numberEnemies = Math.floor(Math.random() * (width + height) / 2)
                for (let i = 0; i < numberEnemies; i++) {
                        this.enemies.push(new Enemy(
                                this,
                                giveAllowedPosition(this.walls),
                                new CowardBehaviour(),
                                10, 10, 3
                        ))
                }
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
                                u.move()
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