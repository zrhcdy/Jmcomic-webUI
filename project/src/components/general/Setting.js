class Setting{
    #settingValues={
        using_imgserver_index:["0","1","2","3","4","5"]
    }

    #options={
        using_imgserver_index:"0"
    }
    constructor(){

    }
    init(){
        for(let key in this.#settingValues){
            let value=localStorage.getItem(key)
            if(value===null)return
            if(this.#settingValues[key].includes(value)){
                this.#options[key]=value
            }else{
                localStorage.setItem(key,this.#options[key])
            }
        }
    }
    setOption(key,value){
        let values=this.#settingValues[key]
        if(typeof value==='number')value=value.toString()
        if(values && values.includes(value)){
            localStorage.setItem(key,value)
            this.#options[key]=value
        }
    }
    get using_imgserver_index(){
        return this.#options.using_imgserver_index
    }
}
export const setting=new Setting()