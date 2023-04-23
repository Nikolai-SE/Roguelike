import { ok } from "assert";
import { add, sub, mul, div, eq } from "./vector";

describe('Vector', () => {
        it('should be equal to itself', () => {
                let v = { x: 1, y: -1 };
                let u = { x: 1, y: -1 };
                ok(eq(v, u));
        });
        it('should not be equal to another', () => {
                let v = { x: 1, y: -1 };
                let u = { x: -1, y: 1 };
                ok(!eq(v, u));
        });
        it('should support addition', () => {
                let v = { x: 1, y: -1 };
                let u = { x: -1, y: 1 };
                let vu = { x: 0, y: 0 };
                ok(eq(vu, add(v, u)));
        });
        it('should support subtraction', () => {
                let v = { x: 1, y: -1 };
                let u = { x: 1, y: -1 };
                let vu = { x: 0, y: 0 };
                ok(eq(vu, sub(v, u)));
        });
        it('should support multiplication', () => {
                let v = { x: 1, y: -1 };
                let kv = { x: 2, y: -2 };
                ok(eq(kv, mul(2, v)));
        });
        it('should support division', () => {
                let v = { x: 1, y: -1 };
                let vu = { x: 0.5, y: -0.5 };
                ok(eq(vu, div(v, 2)));
        });
});
