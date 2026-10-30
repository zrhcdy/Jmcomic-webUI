class Setting {
    // 配置项
    #options = {
        using_imgserver_index: {
            "value":["1","5"],//改为使用数组
            "validValues":["0","1","2","3","4","5"],
            "type":"array"
        }, 
        
        app_theme: {
            "value":"pink",
            "validValues":["pink","blue","green","purple","gray","dark","orange"],
            "type":"string"
        },
        root_margin: {
            "value":"50px",
            "validValues":["0px","50px","100px","200px","500px","1000px","2000px"],
            "type":"string"
        },
        concurrent_request: {
            "value":"on",
            "validValues":["off","on"],
            "type":"string"
        },
        lite_mode: {
            "value":"off",
            "validValues":["off","on"],
            "type":"string"
        },
        cover_img_mode: {
            "value":"fixed5",
            "validValues":["dynamic","fixed5"],
            "type":"string"
        },
        hide_server_switch: {
            "value":"off",
            "validValues":["off","on"],
            "type":"string"
        },
        reader_is_horizontal: {
            "value":"off",
            "validValues":["off","on"],
            "type":"string"
        },
        reader_image_width: {
            "value":"50",
            "validValues":["50","55","60","65","70","75","80","85","90","95","100"],
            "type":"string"
        },
        auto_fullscreen_reader: {
            "value":"off",
            "validValues":["off","on"],
            "type":"string"
        },
    };
    constructor() {}
    init() {
        for (let key in this.#options) {
            let value = localStorage.getItem(key);
            if (value === null) continue;
            if(this.#options[key].type === "array"){
                try{
                    value = JSON.parse(value).array;
                }catch(e){
                    localStorage.setItem(key, this.#options[key]);
                }
            }

            let isValid = false; //默认无效
            if (Array.isArray(value)) {
                isValid = this.#options[key].type=="array" && value.every((v) =>
                    this.#options[key].validValues.includes(v),
                );
                //必须都在白名单里
            } else {
                isValid = this.#options[key].type=="string" && this.#options[key].validValues.includes(value);
            }
            if (isValid) {
                //合法性检查
                this.#options[key].value = value;
            } else {
                localStorage.setItem(key, this.#options[key]);
            }
        }
    }
    setOption(key, value) {
        let values = this.#options[key].validValues;
        if (!Array.isArray(values)) return; //不在白名单

        let isValid = false; //默认无效
        if (Array.isArray(value)) {
            isValid = this.#options[key].type=="array" && value.every((v) => this.#options[key].validValues.includes(v));
            //必须都在白名单里
        } else {
            isValid = this.#options[key].type=="string" && this.#options[key].validValues.includes(value);
        }

        if (!isValid) return; //不在白名单
        
        this.#options[key].value = value;

        if(this.#options[key].type === "array"){
            value = JSON.stringify({array:value});//转换为字符串
        }
        localStorage.setItem(key, value);
    }
    get using_imgserver_index() {
        return this.#options.using_imgserver_index.value;
    }
    get app_theme() {
        return this.#options.app_theme.value;
    }
    get root_margin() {
        return this.#options.root_margin.value;
    }
    get concurrent_request() {
        return this.#options.concurrent_request.value;
    }
    get lite_mode() {
        return this.#options.lite_mode.value;
    }
    get cover_img_mode() {
        return this.#options.cover_img_mode.value;
    }
    get hide_server_switch() {
        return this.#options.hide_server_switch.value;
    }
    get reader_is_horizontal() {
        return this.#options.reader_is_horizontal.value;
    }
    get reader_image_width() {
        return this.#options.reader_image_width.value;
    }
    get auto_fullscreen_reader() {
        return this.#options.auto_fullscreen_reader.value;
    }
    get totalServerCount(){
        return this.#options.using_imgserver_index.validValues.length
    }
}
export const setting = new Setting();