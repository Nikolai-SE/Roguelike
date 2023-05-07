export class Equipment {
    attackDecorator(points: number): number {
            return points;
    }

    getDamageDecorator(points: number): number {
            return points;
    }
}

export class Sword extends Equipment{
    attackDecorator(points: number): number {
            return points * 2;
    }
}

export class Helmet extends Equipment{
    getDamageDecorator(points: number): number {
            return Math.max(points - 2, 1);
    }
}
