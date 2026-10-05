class Setting{
    #settingValues={
        using_imgserver_index:["0","1","2","3","4","5"],
        app_theme:["pink","blue","green","purple","gray","dark"],
        root_margin:["0px","50px","100px","200px","500px"],
        concurrent_request:["off","on"]
    }

    #options={
        using_imgserver_index:"0",
        app_theme:"pink",
        root_margin:"50px",
        concurrent_request:"off"
    }
    constructor(){

    }
    init(){
        for(let key in this.#settingValues){
            let value=localStorage.getItem(key)
            if(value===null)continue
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
    get app_theme(){
        return this.#options.app_theme
    }
    get root_margin(){
        return this.#options.root_margin
    }
    get concurrent_request(){
        return this.#options.concurrent_request
    }
}
export const setting=new Setting()
