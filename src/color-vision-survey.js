/**
 * @title Color Vision Survey
 * @description A short survey to screen participants whether they have color vision deficiencies. 
 * Prolific-ready. 
 * Accepts participant IDs via URL parameter.
 * @version 1.0.0-prolific
 * @imageDir images/common
 * @miscDir misc
 */

"use strict";

import "../styles/main.scss";

// jsPsych plugins
import delay from "delay";
import md5 from "md5";
import { TouchAdapter } from "./util/TouchAdapter";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import SurveyMultiChoicePlugin from "@jspsych/plugin-survey-multi-choice";
import { initJsPsych } from "jspsych";
import PreloadPlugin from "@jspsych/plugin-preload";


const DEBUGMODE = true;
const EXPERIMENT_NAME = "Color TOJ-N6"
const IS_A_PROLIFIC_STUDY = true;


export async function run({ assetPaths }) {
  const jsPsych = initJsPsych();
  const timeline = [{ type: PreloadPlugin, audio: assetPaths.audio }];

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  const prolific_participant_id = urlParams.get('PROLIFIC_PID')
  const prolific_study_id = urlParams.get('STUDY_ID')
  const prolific_session_id = urlParams.get('SESSION_ID')

  if (DEBUGMODE) {
    console.log(`prolific_participant_id: ${prolific_participant_id}`);
    console.log(`prolific_study_id: ${prolific_study_id}`);
    console.log(`prolific_session_id: ${prolific_session_id}`);
  }

  jsPsych.data.addProperties({
    prolific_participant_id: prolific_participant_id,
    prolific_study_id: prolific_study_id,
    prolific_session_id: prolific_session_id
  })

  jsPsych.data.addProperties({
    is_a_prolific_study: IS_A_PROLIFIC_STUDY
  })

  const globalProps = {};
  timeline.push({
    type: SurveyMultiChoicePlugin,
    preamble: `<p>Welcome to the prescreening for ${EXPERIMENT_NAME} experiment!</p>`,
    questions: [
      {
        name: "participant_language",
        prompt: `Most parts of this experiment are available in multiple languages. Please select a language.`,
        options: ["Deutsch", "English"],
        required: true,
      },
    ],
    on_finish: (trial) => {
      const responses = trial.response;
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      let participant_code = urlParams.get('PROLIFIC_PID');
      if (participant_code == null) {
        console.warn("PROLIFIC_PID is null. Set PROLIFIC_PID to `42`.")
        participant_code = "42";
      }
      const newProps = {
        instructionLanguage: responses["participant_language"] === "Deutsch" ? "de" : "en",
        participantCode: md5(participant_code)
      };
      Object.assign(globalProps, newProps);
      jsPsych.data.addProperties(newProps);
    },
  });

  // declaration of consent
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      return `<iframe class="declaration" src="media/misc/declaration_color-vision-survey_${globalProps.instructionLanguage}.html"></iframe>`;
    },
    choices: () => (globalProps.instructionLanguage === "en" ? ["I agree with the terms and conditions"] : ["Ich stimme den Versuchsbedingungen zu"]),
  });

  if (DEBUGMODE) {
    console.log(`participantCode: ${globalProps.participantCode}`)
  }

  timeline.push({
    type: SurveyMultiChoicePlugin,
    questions: () => {
      let survey_visual_deficiency = {
        name: "participant_has_color_vision_deficiency",
        required: true,
      };
      if (globalProps.instructionLanguage === "en") {
        let question = {
          prompt: `Do you have color vision deficiencies? If you do not know whether you have a color vision deficiency you can check your vision with a <a href="https://visionscreening.zeiss.com/en-US/color-check" target="_blank" rel="noopener noreferrer">Ishihara test</a> (external website).`,
          options: ["Yes", "No"],
        };
        Object.assign(survey_visual_deficiency, question);
      } else {
        let question = {
          prompt: `Haben Sie eine Farb-Fehlsichtigkeit (z.B. Rot-Grün-Sehschwäche)?<br>
          Falls Sie nicht wissen, ob Sie farbfehlsichtig sind, können Sie dies beispielsweise mit <a href="https://visionscreening.zeiss.com/de-DE/color-check" target="_blank" rel="noopener noreferrer">Ishihara-Tafeln</a> (externer Link) prüfen. `,
          options: ["Ja", "Nein"],
        };
        Object.assign(survey_visual_deficiency, question);
      }
      return [survey_visual_deficiency];
    },

    button_label: () => {
      if (globalProps.instructionLanguage === "de") {
        return "Antwort absenden und zu prolific.co zurückkehren";
      } else {
        return "Submit answer and return to prolific.co";
      }
    },

    on_finish: (trial) => {
      const responses = trial.response;
      const newProps = {
        color_vision_deficiency: responses["participant_has_color_vision_deficiency"] === "Yes" || responses["participant_has_color_vision_deficiency"] === "Ja" ? true : false,
      };
      Object.assign(globalProps, newProps);
      jsPsych.data.addProperties(newProps);
    },
  });

  // final screen
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: () =>
      globalProps.instructionLanguage === "en"
        ? ["<p>Thank you for participating. Continue to submit the results. You will be redirected to prolific.co.</p>"]
        : ["<p>Vielen Dank für Ihre Teilnahme!</p><p>Fahren Sie fort, um die Resultate abzusenden. Sie werden anschließend zu prolific.co weitergeleitet.</p>"],
    choices: () =>
      globalProps.instructionLanguage === "en"
        ? ["Continue"]
        : ["Weiter"],
  });
  await jsPsych.run(timeline);
  return jsPsych;
}