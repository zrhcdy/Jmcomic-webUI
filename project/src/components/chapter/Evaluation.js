export class Evaluation{
    album;
    evaluationDom;
    likesDom;
    viewsDom;
    jmidDom
    constructor(){
        this.evaluationDom=document.querySelector('.evaluation')
        this.likesDom=this.evaluationDom.querySelector('.likes span')
        this.viewsDom=this.evaluationDom.querySelector('.views span')
        this.jmidDom=this.evaluationDom.querySelector(".jm-id span")
    }
    init(album){
        this.album=album
        this.likesDom.textContent=this.toInternationalNumber(this.album.likes)
        this.viewsDom.textContent=this.toInternationalNumber(this.album.total_views)
        this.jmidDom.textContent=album.id
    }
    toInternationalNumber(num){
        return num>=1000?(num/1000).toFixed(1)+'k':num.toString();
    }
}