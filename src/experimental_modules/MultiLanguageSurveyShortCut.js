import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import SurveyTextPlugin from "@jspsych/plugin-survey-text";

function getChoices(item,lang){
    let choiceID = 1
    const choices = []
    while(item["choice"+choiceID+"_"+lang]){
        choices.push(item["choice"+choiceID+"_"+lang])
        choiceID = choiceID + 1
    }
    return choices
}
function getWriteBackChoices(item){
  let choiceID = 1
  const choices = []
  while(item["writeback"+choiceID]){
      choices.push(item["writeback"+choiceID])
      choiceID = choiceID + 1
  }
  return choices
}

export function MultiLanguageSurveyShortCut(IDList, replacementDict, runtimeStateManager){
    if(Array.isArray(IDList)){
            return IDList.map((id) => {
              if (replacementDict[id]["type"] == "freiText"){
                return {
                  type: SurveyTextPlugin,
                  questions: () => {
                    if (runtimeStateManager.instructionLanguage === "en") {
                      return [
                        {
                          name: `${replacementDict[id]["question_en"]}`,
                          prompt: `<p>${replacementDict[id]["question_en"]}</p>`,
                          required: replacementDict[id]["required"],
                          rows: replacementDict[id]["rows"] ? replacementDict[id]["rows"]:10,
                          columns: replacementDict[id]["rows"] ? replacementDict[id]["columns"]:60,
                        }
                      ];
                    } else {
                      return [
                          {
                            name: `${replacementDict[id]["question_de"]}`,
                            prompt: `<p>${replacementDict[id]["question_de"]}</p>`,
                            required: replacementDict[id]["required"],
                            rows: replacementDict[id]["rows"] ? replacementDict[id]["rows"]:10,
                            columns: replacementDict[id]["rows"] ? replacementDict[id]["columns"]:60,
                          }
                        ];
                    };
                  },
                }
              }
              else if (replacementDict[id]["type"] == "SingleChoice"){
                return {
                    type: HtmlButtonResponsePlugin,
                    stimulus: () => {
                        if(runtimeStateManager.instructionLanguage === "de"){
                          return `${replacementDict[id]["question_de"]}`;
                        }
                        else {
                          return `${replacementDict[id]["question_en"]}`;
                        }

                    },
                    choices: () => getChoices(replacementDict[id], runtimeStateManager.instructionLanguage),
                    on_finish: (trial) => {
                      let setValue = getChoices(replacementDict[id],runtimeStateManager.instructionLanguage)[trial.response]
                      const replaceValues = getWriteBackChoices(replacementDict[id])
                      if(replaceValues.length > 0){
                        setValue = replaceValues[trial.response]
                      }
                      runtimeStateManager.set(id,setValue)
                    },
                  }
              }
              else if (replacementDict[id]["type"] == "html"){
                return {
                  type: HtmlButtonResponsePlugin,
                  stimulus: () => {
                    return replacementDict[id]["question_"+runtimeStateManager.instructionLanguage];
                  },
                  choices: () =>
                    runtimeStateManager.instructionLanguage === "en"
                      ? [replacementDict[id]["button_en"]]
                      : [replacementDict[id]["button_de"]],
                }
              }    
            })
    }
    else{
        throw new Error("Wrong Parameter for Survey Shortcut")
    }
}