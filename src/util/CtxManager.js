export class CtxManager {
    constructor(IS_A_PROLIFIC_STUDY, DEBUGMODE_ENABLED, replacementDict, OPTIONS = {}){
        this.IS_A_PROLIFIC_STUDY = IS_A_PROLIFIC_STUDY
        this.DEBUGMODE_ENABLED = DEBUGMODE_ENABLED
        this.replacementDict = replacementDict
        this.OPTIONS = OPTIONS
    }
    get(key){
        return () => this.OPTIONS[key]
    }

}