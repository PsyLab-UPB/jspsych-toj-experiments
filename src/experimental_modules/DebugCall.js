import CallFunctionPlugin from "@jspsych/plugin-call-function";

export class DebugCall
{
    constructor(ContextManager){
        this.type = CallFunctionPlugin
        this.ContextManager = ContextManager
    }
    
    func = () => {
      if (this.ContextManager.DEBUGMODE_ENABLED) {
        console.warn("debugmode is enabled.");
        console.warn(`IS_A_PROLIFIC_STUDY=${this.ContextManager.IS_A_PROLIFIC_STUDY}`);
        if (this.ContextManager.IS_A_PROLIFIC_STUDY & this.ContextManager.OPTIONS["IS_STARTING_QUESTIONNAIRE_ENABLED"] & this.ContextManager.OPTIONS["IS_FINAL_QUESTIONNAIRE_ENABLED"]) {
          console.warn("This is a study optimized for prolific.co. Starting and final questionnaire are enabled. Please ensure that only either of those or neither is enabled if used for prolific in production.");
        }
      } else {
        console.assert(!(this.ContextManager.IS_A_PROLIFIC_STUDY & this.ContextManager.OPTIONS["IS_STARTING_QUESTIONNAIRE_ENABLED"] & this.ContextManager.OPTIONS["IS_FINAL_QUESTIONNAIRE_ENABLED"]),
          "This is a prolific.co study. Starting and final questionnaire are enabled. Please ensure that only either of those or neither is enabled.");
      }
    }
  }