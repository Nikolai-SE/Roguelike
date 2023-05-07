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

function fight(aggressor: Unit, defender: Unit, absTime: number) {
        aggressor.attack(defender, absTime)
        if (defender.checkDeath()) {
                aggressor.onKill(defender)
                return
        }
        defender.attack(aggressor, absTime)
        if (aggressor.checkDeath()) {
                defender.onKill(aggressor)
        }
}

export abstract class Unit {
        public level: number = 1
        public xp: number = 0
        public limitXp: number = 2
        constructor(
                readonly world: World,
                private _pos: Vector,
                public hp: number,
                public maxHp: number,
                public damage: number,
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
                const unitAtCell = this.world.getUnitAt(pos)
                if (unitAtCell != null) {
                        fight(this, unitAtCell, this.world.lastUpdate)
                        return false
                }
                this._pos.x = pos.x;
                this._pos.y = pos.y;
                return true;
        }

        render(ctx: CanvasRenderingContext2D) {
                ctx.fillStyle = '#7fbfff';
        }

        onKill(killedUnit: Unit): void {
                this.xp += killedUnit.level
                if (this.xp > this.limitXp) {
                        this.xp %= this.limitXp
                        this.level++
                        this.maxHp++
                        this.damage++
                        this.hp = this.maxHp
                        this.limitXp += this.level
                }
        }

        abstract death(): void

        abstract attack(unit: Unit, absTime: number): void

        checkDeath(): boolean {
                if (this.hp <= 0) {
                        this.death()
                        return true
                }
                return false
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
                super(world, pos, hp, maxHp, damage);
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

        death(): void { //TODO: death

        }

        attack(unit: Unit, absTime: number) { //TODO: change to world lstUpdate
                let enemy = unit as Enemy
                enemy.hp -= this.damage
                if (Math.random() < 0.5) {
                        enemy.behaviour = new Confusion(enemy.behaviour, 3000, absTime)
                }
        }
}

function canSee(aggressor: Unit, defender: Unit): boolean {
        const subtracktedPosition = sub(aggressor.pos, defender.pos)
        if (subtracktedPosition.x != 0 && subtracktedPosition.y != 0) {
                return false;
        }

        if (subtracktedPosition.x == 0) {
                const x = aggressor.pos.x
                const leftCol = Math.min(aggressor.pos.y, defender.pos.y)
                const rightCol = Math.max(aggressor.pos.y, defender.pos.y)
                for (let y = leftCol + 1; y < rightCol; y++) {
                        if (aggressor.world.getCellAt({ x, y }) != white) {
                                return false
                        }
                }
        }

        if (subtracktedPosition.y == 0) {
                const y = aggressor.pos.y
                const leftRow = Math.min(aggressor.pos.x, defender.pos.x)
                const rightRow = Math.max(aggressor.pos.x, defender.pos.x)
                for (let x = leftRow + 1; x < rightRow; x++) {
                        if (aggressor.world.getCellAt({ x, y }) != white) {
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

        moveRandom(enemy: Enemy): Vector {
                const num = new SeededRandomUtilities().getRandomIntegar(3);
                switch (num) {
                        case 0:
                                return { x: 0, y: -1 };
                        case 1:
                                return { x: -1, y: 0 };
                        case 2:
                                return { x: 0, y: 1 };
                        default:
                                return { x: 1, y: 0 };
                }
        }

        abstract move(player: Player, enemy: Enemy, absTime: number): void
}

export class PassiveBehaviour extends EnemyBehaviour {
        move(player: Player, enemy: Enemy, absTime: number): void {
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
        move(player: Player, enemy: Enemy, absTime: number): void {
                if (canSee(player, enemy)) {
                        enemy.tryWalk(this.moveTowardsThePlayer(player, enemy))
                } else {
                        enemy.tryWalk(this.moveRandom(enemy))
                }
        }
}

export class CowardBehaviour extends EnemyBehaviour {
        move(player: Player, enemy: Enemy, absTime: number): void {
                if (canSee(player, enemy)) {
                        enemy.tryWalk(this.moveFromThePlayer(player, enemy))
                } else {
                        enemy.tryWalk(this.moveRandom(enemy))
                }
        }
}

export class Confusion extends EnemyBehaviour {
        private behaviour: EnemyBehaviour
        private duration: number
        private timeStart: number
        constructor(behaviour: EnemyBehaviour, duration: number, timeStart: number) {
                super()
                this.behaviour = behaviour
                this.duration = duration
                this.timeStart = timeStart
        }



        move(player: Player, enemy: Enemy, absTime: number): void {
                if (absTime - this.timeStart > this.duration) {
                        this.behaviour.move(player, enemy, absTime)
                } else {
                        enemy.tryWalk(this.behaviour.moveRandom(enemy))
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
                super(world, pos, hp, maxHp, damage);
                this.behaviour = behaviour
        }

        move(absTime: number): void {
                this.behaviour.move(this.world.player, this, absTime)
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

        attack(unit: Unit, absTime: number) {
                unit.hp -= this.damage
        }

        death(): void { //TODO: death
                this.world.enemies.splice(this.world.enemies.indexOf(this), 1)
        }
}


export class World {
        readonly updateFrequency: number = 250
        readonly player: Player;
        readonly enemies: Enemy[] = new Array;
        private randomizer: SeededRandomUtilities;
        private walls: boolean[][];
        public lastUpdate: number = 0

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
                const createrEnemy = new CreateEnemy(this)
                for (let i = 0; i < numberEnemies; i++) {
                        this.enemies.push(createrEnemy.get())
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

        getWalls(): boolean[][] {
                return this.walls
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

export class CreateEnemy {
        private world: World
        private behaviours: EnemyBehaviour[] = [new AggressiveBehaviour(), new PassiveBehaviour(), new CowardBehaviour()]
        private len: number = this.behaviours.length
        private random: SeededRandomUtilities
        constructor(world: World, generator_seed = -1) {
                this.world = world
                this.random = new SeededRandomUtilities(generator_seed.toString())
        }

        private getRandomBehavior(): EnemyBehaviour {
                return this.behaviours[this.random.getRandomIntegar(this.len)]
        }

        private getRandomBefore(m: number): number {
                return this.random.getRandomIntegar(1, m)
        }

        get() {
                return new Enemy(
                        this.world,
                        giveAllowedPosition(this.world.getWalls()),
                        this.getRandomBehavior(),
                        this.getRandomBefore(10),
                        this.getRandomBefore(10),
                        this.getRandomBefore(10)
                )
        }

}
