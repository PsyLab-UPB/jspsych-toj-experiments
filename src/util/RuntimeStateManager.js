export class RuntimeStateManager {
    constructor(jspsych, storage){
        this.instructionLanguage = "en"
        this.staticDict = storage
        this.storage = {}
        this.jspsych = jspsych
    }

    set(key,value){
        const newProps = {}
        newProps[key] = value
        Object.assign(this.storage, newProps);
        this.jspsych.data.addProperties(newProps);
        if(key === "Lang"){
            const newProps2 = {}
            newProps2[key]  = value
            this.instructionLanguage = value
            Object.assign(this.storage, newProps2);
        }
    }
    get(key){
        return () => this.storage[key]
    }
    isTrue(key){
        return () => this.storage[key]
    }
    isFalse(key){
        return () => {
            console.log(key+"="+!this.storage[key])
            return !this.storage[key];
        }
    }
}