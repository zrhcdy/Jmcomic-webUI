import { setting } from "./Setting.js"

export class SwitchServerBtnManager{
    switchServerDom
    titleDom
    serverBtnDoms
    constructor(){
        this.switchServerDom=document.querySelector(".switch-server")
        this.titleDom=this.switchServerDom.querySelector("span")
        this.serverBtnDoms=this.switchServerDom.querySelectorAll(".server-name")
    }
    init(){
        this.#addEvent()
        setting.using_imgserver_index.forEach((v)=>{
            this.setServer(v)
        })
        this.setTitle()
        this.#applyHideServerSwitch()
    }
    #addEvent(){
        // 检查按钮数量是否匹配
        if(this.serverBtnDoms.length!==setting.totalServerCount)return

        
        for(let i=0;i<setting.totalServerCount;i++){
            this.serverBtnDoms[i].addEventListener("click",()=>{
                if(setting.using_imgserver_index.includes(i.toString())) {
                    if(setting.using_imgserver_index.length===1)return
                    this.removeServer(i)
                    setting.setOption("using_imgserver_index",setting.using_imgserver_index.filter((v)=>Number(v)!==i))
                }else{
                    this.setServer(i)
                    setting.setOption("using_imgserver_index",setting.using_imgserver_index.concat([i.toString()]))
                }
                this.setTitle()
                // location.reload() 不再刷新
            })
        }
    }
    setServer(index){
        this.serverBtnDoms[index].classList.add("active")
    }
    removeServer(index){
        this.serverBtnDoms[index].classList.remove("active")
    }
    setTitle(){
        this.titleDom.textContent=`${setting.using_imgserver_index.length>3?"...":setting.using_imgserver_index.map((v)=>1+Number(v)).join(" & ")}`
    }
    #applyHideServerSwitch(){
        if(setting.hide_server_switch==="on"){
            this.switchServerDom.style.display="none"
        }
    }
}