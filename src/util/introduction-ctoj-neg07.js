/**
 * Helper functions to add standard introductory jsPsych trials to a jsPsych timeline.
 */

// jsPsych plugins
/*import "jspsych/plugins/jspsych-html-button-response";
import "jspsych/plugins/jspsych-survey-text";
import "jspsych/plugins/jspsych-survey-multi-choice";
import "jspsych/plugins/jspsych-fullscreen";*/

import estimateVsync from "vsync-estimate";
import { customAlphabet } from "nanoid";
import marked from "marked";
import md5 from "md5";
import SurveyMultiChoicePlugin from "@jspsych/plugin-survey-multi-choice";
import SurveyTextPlugin from "@jspsych/plugin-survey-text";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";

marked.setOptions({ breaks: true });

/**
 * Adds introduction trials to a provided jsPsych timeline and returns an object that will be
 * populated with global properties set during the introduction trials (such as language choice and
 * participant code).
 *
 * The trials are:
 *  * A welcome page with radio buttons for first time participation and language selection, including vsync detection and user agent logging in the background
 *  * A declaration of consent page
 *  * A participation code announcement or input page
 *  * A page to select if it is the last participation
 *  * An age prompt
 *  * A gender prompt
 *  * A switch-to-fullscreen page
 *  * A tutorial page
 *
 * @param {any[]} timeline The jsPsych timeline to add the introduction trials to
 * @param {{
 *   skip?: boolean; // Whether or not to skip the introduction and use default properties; useful for development.
 *   experimentName: string;
 *   askForLastParticipation: boolean;
 *   instructions: { // Markdown instruction strings
 *     de: string;
 *     en: string;
 *   };
 *   isAProlificStudy: boolean;
 * }} options
 *
 * @returns {{
 *  instructionLanguage: "de"|"en";
 *  isFirstParticipation: boolean;
 *  isLastParticipation: boolean;
 *  participantCode: string;
 * }}
 */
export function addIntroduction(jspsych, timeline, options) {
  if (options.skip) {
    return {
      instructionLanguage: "en",
      isFirstParticipation: false,
      isLastParticipation: false,
      participantCode: "ABCD",
      participantCodeMD5: md5("ABCD"),
    };
  }

  const globalProps = {};

  // language selection
  // standalone version: ask for language and whether the user is a returning participant
  if (!options.isAProlificStudy) {
    timeline.push({
      type: SurveyMultiChoicePlugin,
      preamble: `<p>Welcome to the ${options.experimentName} experiment!</p>`,
      questions: [
        {
          name: "is_new_participant",
          prompt: `Is this the first time you participate in this experiment?`,
          options: ["Yes, I have not completed a session, yet.", "No, I am a returning participant and have already completed one session."],
          required: true,
        },
        {
          name: "participant_language",
          prompt: `Most parts of this experiment are available in multiple languages. Please select a language.`,
          options: ["Deutsch", "English"],
          required: true,
        },
      ],
      on_start: async (trial) => {
        const rate = await estimateVsync();
        trial.data.refreshRate = Math.round(rate);
      },
      on_finish: (trial) => {
        const responses = trial.response;
        const newProps = {
          isFirstParticipation: responses['is_new_participant'].includes("Yes"),
          instructionLanguage: responses["participant_language"] === "Deutsch" ? "de" : "en",
        };
        Object.assign(globalProps, newProps);
        jspsych.data.addProperties(newProps);
      },
      data: {
        userAgent: navigator.userAgent,
      },
    });
  }
  // prolific: only ask for language
  else {
    timeline.push({
      type: SurveyMultiChoicePlugin,
      preamble: `<p>Welcome to the ${options.experimentName} experiment!</p>`,
      questions: [
        {
          name: "participant_language",
          prompt: `Most parts of this experiment are available in multiple languages. Please select a language.`,
          options: ["Deutsch", "English"],
          required: true,
        },
      ],
      on_start: async (trial) => {
        const rate = await estimateVsync();
        trial.data.refreshRate = Math.round(rate);
      },
      on_finish: (trial) => {
        const responses = trial.response;
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        let participant_code = urlParams.get("PROLIFIC_PID");
        if (participant_code === null) {
          console.warn("PROLIFIC_PID is null. Set PROLIFIC_PID to `42`.")
          participant_code = "42";
        }
        const newProps = {
          instructionLanguage: responses["participant_language"] === "Deutsch" ? "de" : "en",
          participantCodeMD5: md5(participant_code)
        };
        Object.assign(globalProps, newProps);
        jspsych.data.addProperties(newProps);
      },
      data: {
        userAgent: navigator.userAgent,
      },
    });
  }

  // standalone version: if this is a participant's first session: Participant code announcement / input
  timeline.push({
    conditional_function: () => !options.isAProlificStudy && globalProps.isFirstParticipation,
    timeline: [
      {
        type: HtmlButtonResponsePlugin,
        stimulus: () => {
          const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ123456789", 4);
          const participantCode = nanoid();
          const newProps = {
            participantCode,
            participantCodeMD5: md5(participantCode)
          };
          Object.assign(globalProps, newProps);
          jspsych.data.addProperties(newProps);

          if (globalProps.instructionLanguage === "en") {
            return (
              `<p>Your participant code is <b>${participantCode}</b>.` +
              "</p><p><b>Important:</b> Please make sure to write it down somewhere. You will need it if you will do the second session or multiple sessions and for claiming your course credit!"
            );
          } else {
            return (
              `<p>Ihr Teilnahme-Code ist <b>${participantCode}</b>.` +
              "</p><p><b>Wichtig:</b> Bitte vergessen Sie nicht, sich Ihren Code aufzuschreiben! Sie benötigen ihn, um die zweite Sitzung und ggf. weitere Sitzungen zu machen und Ihre Versuchspersonenstunden gutgeschrieben zu bekommen!"
            );
          }
        },
        choices: () =>
          globalProps.instructionLanguage === "en"
            ? ["Done, let's continue"]
            : ["Ist gemacht, weiter!"],
      },
    ],
  });

  // if user is a returning participant: prompt to enter participant code
  timeline.push({
    conditional_function: () => !globalProps.isFirstParticipation && !options.isAProlificStudy,
    timeline: [
      {
        type: SurveyTextPlugin,
        questions: () => {
          if (globalProps.instructionLanguage === "en") {
            return [{
              prompt:
                "<p>Please enter your participant code (that you got the first time you participated in this experiment).</p>",
              required: true,
            }];
          } else {
            return [{
              prompt:
                "<p>Bitte geben sie ihren Teilnahme-Code ein (den Sie bei der ersten Teilnahme an diesem Experiment bekommen haben).</p>",
              required: true,
            }];
          };
        },
        on_finish: (trial) => {
          const responses = trial.response;

          const newProps = {
            participantCode: responses.Q0,
            participantCodeMD5: md5(responses.Q0)
          };
          Object.assign(globalProps, newProps);
          jspsych.data.addProperties(newProps);
        },
      },
    ],
  });

  // declaration of consent
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      return `<iframe class="declaration" src="media/misc/declaration_color-toj-negation-07_prolific_${globalProps.instructionLanguage}.html"></iframe>`;
    },
    choices: () => (globalProps.instructionLanguage === "en" ? ["I agree with the terms and conditions"] : ["Ich stimme den Versuchsbedingungen zu"]),
  });

  // Instructions to prepare computer
  // Disable any color temperature changing software / settings
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      return `<iframe class="technical-instruction" src="media/misc/technical_instructions_color_temperature_${globalProps.instructionLanguage}.html"></iframe>`;
    },
    choices: () => (globalProps.instructionLanguage === "en" ? ["The blue light filter are deactivated"] : ["Die Blaulichtfilter sind deaktiviert"]),
  });

  // Disable dark reader
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      return `<iframe class="technical-instruction" src="media/misc/technical_instructions_dark_reader_${globalProps.instructionLanguage}.html"></iframe>`;
    },
    choices: () =>
      globalProps.instructionLanguage === "en"
        ? ["Dark mode is inactive <br>and my screen is sufficiently small"]
        : ["Dark mode ist abgeschaltet <br>und mein Bildschirm ist ausreichend klein"],
  });

  if (!options.isAProlificStudy) {
    // Color vision test
    timeline.push({
      type: HtmlButtonResponsePlugin,
      stimulus: () => {
        return `<iframe class="technical-instruction" src="media/misc/technical_instructions_color_vision_${globalProps.instructionLanguage}.html"></iframe>`;
      },
      choices: () =>
        globalProps.instructionLanguage === "en"
          ? ["I do not have color vision deficiencies"]
          : ["Ich habe keine Farbsehschwäche"],
    });
  } else {
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
          return "Weiter";
        } else {
          return "Continue";
        }
      },

      on_finish: (trial) => {
        const responses = trial.response;
        const newProps = {
          color_vision_deficiency: responses["participant_has_color_vision_deficiency"] === "Yes" || responses["participant_has_color_vision_deficiency"] === "Ja" ? true : false,
        };
        Object.assign(globalProps, newProps);
        jspsych.data.addProperties(newProps);
      },
    });
  }

  // Turn on sound
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      return `<iframe class="technical-instruction" src="media/misc/technical_instructions_sound_${globalProps.instructionLanguage}.html"></iframe>`;
    },
    choices: () =>
      globalProps.instructionLanguage === "en"
        ? ["Computer sounds are enabled"]
        : ["Der Ton ist eingeschaltet"],
  });

  // Ask for last participation
  timeline.push({
    conditional_function: () =>
      options.askForLastParticipation === true && !options.isAProlificStudy && !globalProps.isFirstParticipation,
    timeline: [
      {
        type: SurveyMultiChoicePlugin,
        questions: () => {
          if (globalProps.instructionLanguage === "en") {
            return [
              {
                prompt: "Is this your last participation in this experiment?",
                options: ["Yes", "No"],
                required: true,
              },
            ];
          } else {
            return [
              {
                prompt: "Ist dies Ihre letzte Teilnahme an diesem Experiment?",
                options: ["Ja", "Nein"],
                required: true,
              },
            ];
          }
        },
        on_finish: (trial) => {
          const responses = trial.response;
          const newProps = {
            isLastParticipation: responses.Q0 === "Yes" || responses.Q0 === "Ja",
          };
          Object.assign(globalProps, newProps);
          jspsych.data.addProperties(newProps);
        },
      },
    ],
  });

  // Age prompt
  timeline.push({
    conditional_function: () =>
      (!options.isAProlificStudy && globalProps.isFirstParticipation) ||
      (options.isAProlificStudy && options.isStartingQuestionnaireEnabled),
    timeline: [
      {
        type: SurveyTextPlugin,
        questions: [{
          name: "participant_age",
          prompt: "Please enter your age.",
          required: true
        }],
      },
      {
        type: SurveyMultiChoicePlugin,
        questions: [
          {
            name: "participant_gender",
            prompt: "Please select your gender.",
            options: ["male", "female", "diverse"],
            required: true,
            horizontal: true,
          },
        ],
      },
    ],
  });

  // Switch to fullscreen
  timeline.push({
    type: FullscreenPlugin,
    fullscreen_mode: true,
    message: () =>
      globalProps.instructionLanguage === "en"
        ? ["<p>The experiment will switch to full screen mode when you press the button below.</p>"]
        : ["<p>Das Experiment wechselt in den Vollbild-Modus, sobald Sie die Schaltfläche betätigen.</p>"],
    button_label: () =>
      globalProps.instructionLanguage === "en"
        ? ["Switch to full screen mode"]
        : ["In Vollbild-Modus wechseln"],
  });

  // Instructions
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: () => options.instructions(),
    choices: () =>
      globalProps.instructionLanguage === "en"
        ? ["Got it, start the tutorial"]
        : ["Alles klar, Übungsrunde starten"],
  });

  return globalProps;
}