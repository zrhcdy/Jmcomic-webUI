export class Queue {
    arr = [];
    maxLength;
    constructor(maxLength) {
        this.maxLength = maxLength;
    }
    hasEmptySeat() {
        return this.arr.length < this.maxLength;
    }
    add(item) {
        this.arr.push(item);
        if (this.arr.length > this.maxLength) this.arr.shift();
    }
    getItem(index) {
        return this.arr[index];
    }
    removeItem(item) {
        let index=this.arr.indexOf(item)
        if(index==-1)return
        this.arr.splice(index, 1);
    }
    getAndRemoveItem(index) {
        let item = this.getItem(index);
        this.removeItem(index);
        return item;
    }
}
