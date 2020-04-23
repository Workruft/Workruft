class Enums {
    static create({ name = undefined, items = [] }) {
        let newEnum = {};
        newEnum.length = items.length;
        newEnum.items = items;
        for (let itemIndex in items) {
            //Map by name.
            newEnum[items[itemIndex]] = parseInt(itemIndex, 10);
            //Map by index.
            newEnum[parseInt(itemIndex, 10)] = items[itemIndex];
        }
        newEnum.toString = Enums.enumToString.bind(newEnum);
        newEnum.valueOf = newEnum.toString;
        //Optional naming and global registration.
        if (name != undefined) {
            newEnum.name = name;
            Enums[name] = newEnum;
        }
        //Prevent modification of the enum object.
        Object.freeze(newEnum);
            return newEnum;
    }
    static enumToString() {
        return "Enum " +
            (this.name != undefined ? this.name + " " : "") +
            "[" + this.items.toString() + "]";
    }
}