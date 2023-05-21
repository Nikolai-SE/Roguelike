import { ok, equal } from "assert";
import { FileWorldBuilder, World } from "./world_builder";
import { Vector, eq } from "./vector";
import { wall } from "./game_rules";

describe('FileWorldBuilder', () => {
    let fileWorldBuilder: FileWorldBuilder = new FileWorldBuilder;
    let JSONWorldRecord: string = `
    {
        "size":{
           "x":5,
           "y":5
        },
        "walls":[
           {
              "x":1,
              "y":1
           },
           {
              "x":2,
              "y":2
           },
           {
              "x":3,
              "y":3
           }
        ],
        "player":{
           "pos":{
              "x":3,
              "y":4
           },
           "hp":9,
           "maxHp":10,
           "damage":4
        },
        "enemies":[
           {
              "pos":{
                 "x":2,
                 "y":4
              },
              "hp":8,
              "maxHp":9,
              "damage":5
           }
        ],
        "equipment":{
           
        }
     }`;
    fileWorldBuilder.source = JSONWorldRecord;
    let fileWorld: World = fileWorldBuilder.build();

    it('should read boundaries correctly', () => {
        let correctBoundaries: Vector = { x: 5, y: 5 };
        ok(eq(fileWorld.boundaries, correctBoundaries));
    });

    it('should read walls correctly', () => {
        let walls: Vector[] = [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
            { x: 3, y: 3 }
        ];
        walls.forEach((pos: Vector) => equal(fileWorld.getCellAt(pos), wall));
    });

    it('should read player correctly', () => {
        ok(eq(fileWorld.player.pos, {x: 3, y: 4}));
        ok(fileWorld.player.hp === 9);
        ok(fileWorld.player.maxHp === 10);
        ok(fileWorld.player.damage === 4);
    });

    it('should read enemies correctly', () => {
        let enemy = fileWorld.getUnitAt({x: 2, y: 4});
        ok(eq(enemy!.pos, {x: 2, y: 4}));
        ok(enemy!.hp === 8);
        ok(enemy!.maxHp === 9);
        ok(enemy!.damage === 5);
    });
});