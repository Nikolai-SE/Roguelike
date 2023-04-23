import { ok } from "assert";
import { eq } from "./rectangle";

describe('Rectangle', () => {
        it('should be equal to itself', () => {
                const a = {
                        xMin: 1,
                        xMax: 2,
                        yMin: 3,
                        yMax: 4,
                };
                const b = {
                        xMin: 1,
                        xMax: 2,
                        yMin: 3,
                        yMax: 4,
                };
                ok(eq(a, b));
        });
        it('should not be equal to another', () => {
                const a = {
                        xMin: 1,
                        xMax: 2,
                        yMin: 3,
                        yMax: 4,
                };
                const b = {
                        xMin: 5,
                        xMax: 6,
                        yMin: 7,
                        yMax: 8,
                };
                ok(!eq(a, b));
        });
});
