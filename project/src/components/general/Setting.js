class Setting{
    #settingValues={
        using_imgserver_index:["0","1","2","3","4","5"],
        app_theme:["pink","blue","green","purple","gray","dark"],
        root_margin:["0px","50px","100px","200px","500px","1000px"],
        concurrent_request:["off","on"],
        lite_mode:["off","on"],
        cover_img_mode:["dynamic","fixed5"],
        hide_server_switch:["off","on"],
        reader_is_horizontal:["off","on"],
        reader_image_width:["50","55","60","65","70","75","80","85","90","95","100"],
        auto_fullscreen_reader:["off","on"]
    }

    #options={
        using_imgserver_index:"0",
        app_theme:"pink",
        root_margin:"50px",
        concurrent_request:"off",
        lite_mode:"off",
        cover_img_mode:"fixed5",
        hide_server_switch:"off",
        reader_is_horizontal:"off",
        reader_image_width:"100",
        auto_fullscreen_reader:"off"
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
    get lite_mode(){
        return this.#options.lite_mode
    }
    get cover_img_mode(){
        return this.#options.cover_img_mode
    }
    get hide_server_switch(){
        return this.#options.hide_server_switch
    }
    get reader_is_horizontal(){
        return this.#options.reader_is_horizontal
    }
    get reader_image_width(){
        return this.#options.reader_image_width
    }
    get auto_fullscreen_reader(){
        return this.#options.auto_fullscreen_reader
    }
}
export const setting=new Setting()