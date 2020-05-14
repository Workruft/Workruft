Enums.create({
    name: 'OrderTypes',
    items: [ 'Move', 'Attack', 'AttackMove', 'HoldPosition', 'Patrol', 'Build' ]
});

class Order {
    constructor({ type, data = {} }) {
        this.type = type;
        this.data = data;
    }
}