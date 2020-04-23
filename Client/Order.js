Enums.create({
    name: 'OrderTypes',
    items: [ 'Move', 'Attack', 'AttackMove', 'HoldPosition', 'Build' ]
});

class Order {
    constructor({ type, data = {} }) {
        this.type = type;
        this.data = data;
    }
}