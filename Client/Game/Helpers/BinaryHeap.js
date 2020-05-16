//May or may not be stolen codez. ^^
//Guarantees first element is lowest-scored.
//It doesn't maintain sorting of the entire array; rather, it keeps it hierarchically sorted (if thought of as a tree).
class BinaryHeap extends Array {
    constructor({ scoringFunction }) {
        super();
        this.scoringFunction = scoringFunction;
    }

    push(element) {
        this.bubbleUp(super.push(element) - 1);
    }

    //Pops off and returns the lowest-scored element.
    pop() {
        const top = this[0];
        const bottom = super.pop();
        if (this.length > 0) {
            this[0] = bottom;
            this.sinkDown(0);
        }
        return top;
    }

    remove(element) {
        const length = this.length;
        for (let i = 0; i < length; i++) {
            if (this[i] !== element) {
                continue;
            }
            const bottom = super.pop();
            if (i === length - 1) {
                break;
            }
            this[i] = bottom;
            this.bubbleUp(i);
            this.sinkDown(i);
            break;
        }
    }

    bubbleUp(index) {
        const element = this[index];
        const score = this.scoringFunction(element);
        while (index > 0) {
            const parentIndex = Math.floor((index + 1) / 2) - 1;
            const parent = this[parentIndex];
            if (score >= this.scoringFunction(parent)) {
                break;
            }
            this[parentIndex] = element;
            this[index] = parent;
            index = parentIndex;
        }
    }

    sinkDown(index) {
        const length = this.length;
        const element = this[index];
        const score = this.scoringFunction(element);
        while (true) {
            const rightIndex = (index + 1) * 2;
            const leftIndex = rightIndex - 1;
            let leftScore;
            let swapIndex = null;
            if (leftIndex < length) {
                const left = this[leftIndex];
                leftScore = this.scoringFunction(left);
                if (leftScore < score) {
                    swapIndex = leftIndex;
                }
            }
            if (rightIndex < length) {
                const right = this[rightIndex];
                if (this.scoringFunction(right) < (swapIndex === null ? score : leftScore)) {
                    swapIndex = rightIndex;
                }
            }
            if (swapIndex === null) {
                break;
            }
            this[index] = this[swapIndex];
            this[swapIndex] = element;
            index = swapIndex;
        }
    }
}