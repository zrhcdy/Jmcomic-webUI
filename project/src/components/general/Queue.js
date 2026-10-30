export class Queue {
    arr = [];
    pending = [];
    maxLength;
    maxPendingLength;
    constructor(maxLength,maxPendingLength) {
        this.maxLength = maxLength;
        this.maxPendingLength=maxPendingLength;
    }
    add(key,onTrigger,onKickout) {
        if(this.arr.includes(key))return
        if(this.arr.length < this.maxLength){
            this.arr.push(key);
            onTrigger()
            return
        }
        this.#addPending(key,onTrigger,onKickout);
    }
    #addPending(key,onTrigger,onKickout) {
        if(this.pending.find((v)=>v.key === key))return
        if(this.pending.length >= this.maxPendingLength){
            let p = this.pending.shift()
            p.onKickout();
        }
        this.pending.push({
            key,onTrigger,onKickout
        });
    }
    getItem(index) {
        return this.arr[index];
    }
    removeItem(item) {
        let index=this.arr.indexOf(item)
        if(index==-1)return
        this.arr.splice(index, 1);
        if(this.pending.length>0){
            let p=this.pending.shift()
            p.onTrigger();
            this.arr.push(p.key);
        }
        
    }
    getAndRemoveItem(index) {
        let item = this.getItem(index);
        this.removeItem(index);
        return item;
    }
}
