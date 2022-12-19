/**
 * @title Color TOJ Neg 7
 * @description Experiment on negation in TVA instructions (dual-colored version with two stimuli, a merge of experiment color-toj-negation-06.js as a skeleton (meta data collection) and experiment color-toj-negation-02.js for trial presentation (display of two stimuli instead of two stimuli pairs). This experiment is a replication of color-toj-negation-02.js with trials ordered in two halfs negations/assertions. Aside from that, following improvements / changes were made:
 * - Tutorial has to be repeated if a certain threshhold of correct answers is not passed. If the participant fails the tutorial twice, the experiment ends immediately.
 * - Generate trials which are asserted only in one half of the experiment and negated only in the other half of the experiment. Which half is asserted and which negated depends on the participant code (that is generated randomly initially) and if its the first, secocnd, or third participation of the participant (halfes are switched on every participation).
 * @version 1.0-prolific-p1
 * @imageDir images/common
 * @audioDir audio/color-toj-negation,audio/feedback
 * @miscDir misc
 */

"use strict";

import "../styles/main.scss";

// jsPsych plugins
import { TojPluginWhichFirst } from "./plugins/jspsych-toj-negation-which_first";

import { copy } from "./util/trialGenerator";

import { sample } from "lodash";
import randomInt from "random-int";
import marked from "marked";

import { TouchAdapter } from "./util/TouchAdapter";
import { Scaler } from "./util/Scaler";
import { createBarStimulusGrid } from "./util/barStimuli";
import { setAbsolutePosition } from "./util/positioning";
import { LabColor } from "./util/colors";
import { addIntroduction } from "./util/introduction-ctoj-neg06";
import CallFunctionPlugin from "@jspsych/plugin-call-function";
import SurveyTextPlugin from "@jspsych/plugin-survey-text";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import { initJsPsych } from "jspsych";
import PreloadPlugin from "@jspsych/plugin-preload";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import TojPlugin from "./plugins/TojPlugin";

const soaChoices = [-6, -4, -3, -2, -1, 0, 1, 2, 3, 4, 6].map((x) => x * 16.667);
const soaChoicesTutorial = [-6, -3, 3, 6].map((x) => (x * 16.6667).toFixed(3));

const debugmode = false;
const IS_A_PROLIFIC_STUDY = false;

// is only relevant if IS_A_PROLIFIC_STUDY evaluates to true
const IS_STARTING_QUESTIONNAIRE_ENABLED = false;
const IS_FINAL_QUESTIONNAIRE_ENABLED = false;

class TojTarget {
  /**
   * The target's color
   * @type {LabColor}
   */
  color;

  /**
   * Whether the target is displayed on the left side of the screen
   * @type boolean
   */
  isLeft;

  /**
   * Whether the target serves as a probe or a reference
   * @type boolean
   */
  isProbe;

  /**
   * Position of the target within the bar grid ([x, y])
   * @type number[]
   */
  gridPosition;
}

class ConditionGenerator {
  /**
   * The size ([x, y]) of the grid in one half
   */
  static gridSize = [7, 7];

  /**
   * Color variation (in LAB degree) between targets of a pair
   */
  static alpha = 20;

  _previousOrientations = {};
  _previousPositions = {};

  generateOrientation(identifier = null) {
    let orientation;
    do {
      orientation = randomInt(0, 17) * 10;
    } while (identifier && orientation == this._previousOrientations[identifier]);
    if (identifier) {
      this._previousOrientations[identifier] = orientation;
    }
    return orientation;
  }

  static generateRandomPos(xRange, yRange) {
    return [randomInt(...xRange), randomInt(...yRange)];
  }

  generatePosition(identifier, xRange = [2, 5], yRange = [2, 5]) {
    let pos;
    do {
      pos = ConditionGenerator._generateRandomPos(xRange, yRange);
    } while (pos == this._previousPositions[identifier]);
    this._previousPositions[identifier] = pos;
    return pos;
  }

  static getRandomPrimaryColor() {
    return new LabColor(sample([0, 180]));
  }

  generateCondition(probeLeft) {
    const alpha = ConditionGenerator.alpha;
    let targets = {};

    // Generate a target pair
    const probe = new TojTarget();
    probe.isProbe = true;
    probe.isLeft = probeLeft;
    probe.color = ConditionGenerator.getRandomPrimaryColor();

    const reference = new TojTarget();
    reference.isProbe = false;
    reference.isLeft = !probeLeft;
    reference.color = probe.color.getRandomRelativeColor([180]);

    [probe, reference].map((target) => {
      const xRange = target.isLeft ? [3, 5] : [2, 4];
      target.gridPosition = ConditionGenerator.generateRandomPos(xRange, [2, 5]);
    });

    targets = { probe, reference, fixationTime: randomInt(300, 500) };

    return {
      targets,
      rotation: this.generateOrientation(),
    };
  }
}

const conditionGenerator = new ConditionGenerator();

const leftKey = "q";
const rightKey = "p";

export async function run({ assetPaths }) {
  const jsPsych = initJsPsych();
  const timeline = [{ type: PreloadPlugin, audio: assetPaths.audio }];
  timeline.push({
    type: CallFunctionPlugin,
    func: function () {
      if (debugmode) {
        console.warn("debugmode is enabled.");
        console.warn(`IS_A_PROLIFIC_STUDY=${IS_A_PROLIFIC_STUDY}`);
        if (
          IS_A_PROLIFIC_STUDY &
          IS_STARTING_QUESTIONNAIRE_ENABLED &
          IS_FINAL_QUESTIONNAIRE_ENABLED
        ) {
          console.warn(
            "This is a study optimized for prolific.co. Starting and final questionnaire are enabled. Please ensure that only either of those or neither is enabled if used for prolific in production."
          );
        }
      } else {
        console.assert(
          !(
            IS_A_PROLIFIC_STUDY &
            IS_STARTING_QUESTIONNAIRE_ENABLED &
            IS_FINAL_QUESTIONNAIRE_ENABLED
          ),
          "This is a prolific.co study. Starting and final questionnaire are enabled. Please ensure that only either of those or neither is enabled."
        );
      }
    },
  });

  timeline.push({
    type: CallFunctionPlugin,
    func: function () {
      let prolific_participant_id;
      let prolific_study_id;
      let prolific_session_id;

      if (typeof jatos !== "undefined") {
        prolific_participant_id = jatos.urlQueryParameters.PROLIFIC_PID;
        prolific_study_id = jatos.urlQueryParameters.STUDY_ID;
        prolific_session_id = jatos.urlQueryParameters.SESSION_ID;

        jsPsych.data.addProperties({
          prolific_participant_id: prolific_participant_id,
          prolific_study_id: prolific_study_id,
          prolific_session_id: prolific_session_id,
        });
      }

      if (debugmode) {
        console.log(`prolific_participant_id: ${prolific_participant_id}`);
        console.log(`prolific_study_id: ${prolific_study_id}`);
        console.log(`prolific_session_id: ${prolific_session_id}`);
      }
    },
  });

  jsPsych.data.addProperties({
    is_a_prolific_study: IS_A_PROLIFIC_STUDY,
    is_starting_questionnaire_enabled: IS_STARTING_QUESTIONNAIRE_ENABLED,
    is_final_questionnaire_enabled: IS_FINAL_QUESTIONNAIRE_ENABLED,
  });

  var showInstructions = function (jspsych) {
    let participantID = globalProps.participantCode;
    let isAssertedFirst = participantID.charCodeAt(0) % 2 === 0;
    let isAnswerKeySwitchEnabled = participantID.charCodeAt(0) % 2 === 0;

    Object.assign(globalProps, { isAnswerKeySwitchEnabled: isAnswerKeySwitchEnabled });
    jspsych.data.addProperties({ isAnswerKeySwitchEnabled: isAnswerKeySwitchEnabled });
    Object.assign(globalProps, { isAssertedFirst: isAssertedFirst });
    jspsych.data.addProperties({ isAssertedFirst: isAssertedFirst });

    if (debugmode) {
      console.log(`participantID=${globalProps.participantCode}`);
      //console.log(`isAnswerKeySwitchEnabled=${isAnswerKeySwitchEnabled}`);
      console.log(`isAnswerKeySwitchEnabled=${globalProps.isAnswerKeySwitchEnabled}`);
      //console.log(`isAssertedFirst=${isAssertedFirst}`);
      console.log(`isAssertedFirst=${globalProps.isAssertedFirst}`);
    }

    let instructionsWithoutKeySwitch = {
      en: `If it flashed first (i.e., before the other bar), please press **Q** (or tap on the **left-hand half** of your touchscreen).
 If it flashed second (i.e., after the other bar), please press **P** (or tap on the **right-hand half** of your touchscreen).
 
 Please try to be as exact as possible and avoid mistakes.
 If it is not clear to you whether the respective bar flashed first or second, you may guess the answer.
 
 Example: If the voice announces “not green” you will have to judge the red bar. Did it flash before the green bar? Then pressing **Q** or a **left-hand tap** is the correct response. Did the red bar flash after the green bar? Then pressing **P** or tapping the **right-hand side** is correct.`,

      de: `Hat er zuerst geblinkt (vor dem anderen), drücken Sie **Q** (oder tippen Sie auf die **linke Bildschirmhälfte**).
 Hat er nach dem anderen (also als zweiter) geblinkt, drücken Sie **P** (oder tippen Sie auf die **rechte Bildschirmhälfte**).
 
 Versuchen Sie genau zu sein und keine Fehler zu machen.
 Wenn Sie nicht wissen, welcher Strich zuerst blinkte, raten Sie.
 
 Ein Beispiel: Wenn die Stimme „nicht grün“ ansagt, müssen Sie den roten Strich beurteilen. Hat er vor dem grünen geblinkt? Dann ist das Tippen der **Q**-Taste oder auf die linke Bildschirmhälfte korrekt. Hat der rote Strich nach dem grünen geblinkt? Dann ist die **P**-Taste bzw. das Antippen der rechten Bildschirmhälfte korrekt.`,
    };

    let instructionsWithKeySwitch = {
      en: `If it flashed first (i.e., before the other bar), please press **P** (or tap on the **right-hand half** of your touchscreen).
 If it flashed second (i.e., after the other bar), please press **Q** (or tap on the **left-hand half** of your touchscreen).
 
 Please try to be as exact as possible and avoid mistakes.
 If it is not clear to you whether the respective bar flashed first or second, you may guess the answer.
 
 Example: If the voice announces “not green” you will have to judge the red bar. Did it flash before the green bar? Then pressing **P** or **right-hand tap** is the correct response. Did the red bar flash after the green bar? Then pressing **Q** or tapping the **left-hand side** is correct.`,

      de: `Hat er zuerst geblinkt (vor dem anderen), drücken Sie **P** (oder tippen Sie auf die **rechte Bildschirmhälfte**).
 Hat er nach dem anderen (also als zweiter) geblinkt, drücken Sie **Q** (oder tippen Sie auf die **linke Bildschirmhälfte**).
 
 Versuchen Sie genau zu sein und keine Fehler zu machen.
 Wenn Sie nicht wissen, welcher Strich zuerst blinkte, raten Sie.
 
 Ein Beispiel: Wenn die Stimme „nicht grün“ ansagt, müssen Sie den roten Strich beurteilen. Hat er vor dem grünen geblinkt? Dann ist das Tippen der **P**-Taste oder auf die **rechte** Bildschirmhälfte korrekt. Hat der rote Strich nach dem grünen geblinkt? Dann ist die **Q**-Taste bzw. das Antippen der **linken** Bildschirmhälfte korrekt.`,
    };

    let instructions = {
      en: `You will see a grid of bars and a circle in the center. Please try to focus the circle during the whole experiment.
 Two of the bars will be colored (red or green).
 At the beginning of each trial, you will hear an instruction like "now red" or "not green".
 This informs you which bar is relevant for the respective trial.
 Then, each of the colored bars will flash once.
 Based on this, your task is to decide whether the bar indicated by the instruction flashed first or second.
 
 ${isAnswerKeySwitchEnabled ? instructionsWithKeySwitch.en : instructionsWithoutKeySwitch.en}
 
 The experiment will start with a tutorial of 30 trials. After each tutorial trial a sound will indicate whether your answer was correct or not.
 Note that the playback of audio may be delayed for some of the first trials.
       `,
      de: `
 Sie sehen gleich ein Muster aus überwiegend grauen Streifen und einen Kreis in der Mitte. Schauen sie möglichst während des gesamten Experimentes auf diesen Kreis.
 Jeweils ein Streifen rechts und links des mittig platzierten Kreises ist grün bzw. rot.
 Am Anfang jedes Durchgangs hören Sie eine Anweisung wie beispielsweise „jetzt rot“ oder „nicht grün“.
 Diese sagt Ihnen, welcher Streifen beurteilt werden soll.
 Anschließend wird jeder der farbigen Streifen kurz blinken.
 Ihre Aufgabe ist es zu entscheiden, ob der in der Anweisung benannte Streifen vor oder nach dem anderen farbigen Streifen blinkte.
 
 ${isAnswerKeySwitchEnabled ? instructionsWithKeySwitch.de : instructionsWithoutKeySwitch.de}
 
 Das Experiment beginnt mit einer Übungsrunde von 30 Durchgängen, in dem Ihnen die Korrektheit jeder Antwort durch einen Ton zurückgemeldet wird.
 Die Audiowiedergabe kann bei den ersten Durchgängen leicht verzögert sein.
       `,
    };
    return globalProps.instructionLanguage === "en" ? instructions.en : instructions.de;
  };

  const globalProps = addIntroduction(jsPsych, timeline, {
    skip: false,
    askForLastParticipation: true,
    experimentName: "Color TOJ-N7",
    instructions: () => showInstructions(jsPsych),
    isAProlificStudy: IS_A_PROLIFIC_STUDY,
    isStartingQuestionnaireEnabled: IS_STARTING_QUESTIONNAIRE_ENABLED,
  });

  if (debugmode) {
    console.log(`participantCode: ${globalProps.participantCode}`);
  }

  // Generate trials
  const factorsNegated = {
    isInstructionNegated: [false],
    probeLeft: [true, false],
    soa: soaChoices,
  };
  const factorsAsserted = {
    isInstructionNegated: [true],
    probeLeft: [true, false],
    soa: soaChoices,
  };
  const factorsTutorial = {
    isInstructionNegated: [true, false],
    probeLeft: [true, false],
    soa: soaChoicesTutorial,
  };
  const factorsDebug = {
    isInstructionNegated: [true, false],
    soa: [-6, 6].map((x) => (x * 16.6667).toFixed(3)),
    sequenceLength: [1, 2],
  };

  // create arrays with negated and asserted trials
  const repetitions = 2;
  let trialsNegated = jsPsych.randomization.factorial(factorsNegated, repetitions);
  let trialsAsserted = jsPsych.randomization.factorial(factorsAsserted, repetitions);
  let blockCount = 6;

  // only used for tutorial and debugging in this experiment
  let trials = jsPsych.randomization.factorial(factorsTutorial, 2);

  if (debugmode) {
    trials = jsPsych.randomization.factorial(factorsDebug, repetitions);
  }

  const touchAdapterLeft = new TouchAdapter(leftKey);
  const touchAdapterRight = new TouchAdapter(rightKey);

  let scaler; // Will store the Scaler object for the TOJ plugin

  // Create TOJ plugin trial object
  const toj = {
    type: TojPluginWhichFirst,
    modification_function: (element) => TojPluginWhichFirst.flashElement(element, "toj-flash", 30),
    soa: jsPsych.timelineVariable("soa"),
    first_key: () => (globalProps.isAnswerKeySwitchEnabled ? rightKey : leftKey), //leftKey,
    second_key: () => (globalProps.isAnswerKeySwitchEnabled ? leftKey : rightKey), //rightKey,
    probe_key: () => "undefined",
    reference_key: () => "undefined",
    instruction_negated: jsPsych.timelineVariable("isInstructionNegated"),
    instruction_voice: () => sample(["m", "f"]),
    on_start: async (trial) => {
      // console.log(trial.soa)
      // console.log(trial.hasGreenInInstruction ? "green called": "red called")
      // console.log((trial.hasGreenInInstruction !== trial.instruction_negated) ? "green meant": "red meant")
      // console.log(trial.instruction_negated ? "instruction negated": "instruction not negated")
      // console.log((trial.soa <= 0  === (trial.hasGreenInInstruction != trial.instruction_negated ))? leftKey : rightKey)
      const probeLeft = jsPsych.timelineVariable("probeLeft", true);

      const cond = conditionGenerator.generateCondition(probeLeft);

      // Log probeLeft and condition
      trial.data = {
        probeLeft,
        condition: cond,
        // sequenceLength: jsPsych.timelineVariable("sequenceLength", true),
        // rank: jsPsych.timelineVariable("rank", true),
        // blockIndex: jsPsych.timelineVariable("blockIndex", true),
        // trialIndexInThisTimeline: jsPsych.timelineVariable("trialIndex", true),
        // trialIndexInThisBlock: jsPsych.timelineVariable("trialIndexInBlock", true),
      };

      trial.fixation_time = cond.fixationTime;
      trial.instruction_language = globalProps.instructionLanguage;

      // Set instruction color
      trial.instruction_filename = (
        trial.instruction_negated ? cond.targets.reference : cond.targets.probe
      ).color.toName();
    },
    on_load: async () => {
      const trial = jsPsych.getCurrentTrial();
      const { condition } = trial.data;

      const plugin = TojPlugin.current;

      const gridColor = "#777777";

      // Create targets and grids
      [condition.targets.probe, condition.targets.reference].map((target) => {
        const [gridElement, targetElement] = createBarStimulusGrid(
          ConditionGenerator.gridSize,
          target.gridPosition,
          target.color.toRgb(),
          gridColor,
          1,
          0.7,
          0.1,
          condition.rotation
        );
        plugin.appendElement(gridElement);
        (target.isLeft ? touchAdapterLeft : touchAdapterRight).bindToElement(gridElement);

        setAbsolutePosition(
          gridElement,
          (target.isLeft ? -1 : 1) * ConditionGenerator.gridSize[0] * 20,
          0
        );

        // Specify the elements for TOJ
        if (target.isProbe) {
          trial.probe_element = targetElement;
        } else {
          trial.reference_element = targetElement;
        }
      });
      if (debugmode) {
        console.log("Probe color: " + condition.targets.probe.color.toName());
        console.log("Ref color: " + condition.targets.reference.color.toName());
      }
      // Fit to window size
      scaler = new Scaler(
        document.getElementById("jspsych-toj-container"),
        ConditionGenerator.gridSize[0] * 40 * 2,
        ConditionGenerator.gridSize[1] * 40,
        10
      );
    },
    on_finish: function (data) {
      scaler.destruct();
      touchAdapterLeft.unbindFromAll();
      touchAdapterRight.unbindFromAll();

      if (debugmode) {
        console.log(data);
      }

      // count correct responses in tutorial
      if (data["play_feedback"] === true) {
        if (data.response_correct === true) {
          correctResponsesTutorial += 1;
        }
      }
    },
  };

  const cursor_off = {
    type: CallFunctionPlugin,
    func: function () {
      document.body.style.cursor = "none";
    },
  };

  const cursor_on = {
    type: CallFunctionPlugin,
    func: function () {
      document.body.style.cursor = "auto";
    },
  };

  // Tutorial
  let tutorialAlreadyCompleted = false;
  let numberOfTrialsTutorial = 30;
  let numberOfTrialsRepeatedTutorial = 10;
  let correctResponsesTutorial = 0;
  let correctResponsesLimitTutorial = Math.floor(0.75 * numberOfTrialsTutorial);
  let correctResponsesLimitRepeatedTutorial = Math.floor(0.75 * numberOfTrialsRepeatedTutorial);
  let maxRepetitionsTutorial = 2;

  let trialsTutorial = trials.slice(0, debugmode ? 10 : numberOfTrialsTutorial);
  let trialsRepeatedTutorial = trials.slice(0, debugmode ? 10 : numberOfTrialsRepeatedTutorial);

  // Repeat Tutorial until participant gives enough correct answers (correctResponsesLimitTutorial).
  // After 2 failed tries (maxRepetitionsTutorial) the experiment ends immediately.
  for (let index = 1; index <= maxRepetitionsTutorial; index++) {
    timeline.push(
      cursor_on,
      {
        conditional_function: () => index > 1 && !tutorialAlreadyCompleted,
        timeline: [
          {
            type: HtmlButtonResponsePlugin,
            stimulus: () => marked(showInstructions(jsPsych)),
            choices: () =>
              globalProps.instructionLanguage === "en"
                ? ["Got it, start the tutorial"]
                : ["Alles klar, Tutorial starten"],
          },
        ],
      },
      cursor_off,
      {
        conditional_function: () =>
          globalProps.isFirstParticipation &&
          correctResponsesTutorial < correctResponsesLimitTutorial,
        timeline: [toj],
        timeline_variables: trialsTutorial,
        play_feedback: true,
      },
      {
        conditional_function: () =>
          !globalProps.isFirstParticipation &&
          correctResponsesTutorial < correctResponsesLimitRepeatedTutorial,
        timeline: [toj],
        timeline_variables: trialsRepeatedTutorial,
        play_feedback: true,
      },
      cursor_on,
      {
        conditional_function: () =>
          globalProps.isFirstParticipation &&
          correctResponsesTutorial >= correctResponsesLimitTutorial &&
          !tutorialAlreadyCompleted,
        timeline: [
          {
            type: HtmlButtonResponsePlugin,
            stimulus: () =>
              globalProps.instructionLanguage === "en"
                ? [
                    `<p>You finished the tutorial with ${correctResponsesTutorial}/${numberOfTrialsTutorial} correct responses.</p>`,
                  ]
                : [
                    `<p>Sie haben das Tutorial mit ${correctResponsesTutorial}/${numberOfTrialsTutorial} richtigen Antworten abgeschlossen.</p>`,
                  ],
            choices: () =>
              globalProps.instructionLanguage === "en"
                ? ["Continue to the experiment"]
                : ["Weiter zum Experiment"],
          },
          {
            type: CallFunctionPlugin,
            func: () => {
              tutorialAlreadyCompleted = true;
              jsPsych.data.addProperties({
                tutorialCompletedSuccessfully: true,
              });
            },
          },
        ],
      },
      {
        conditional_function: () =>
          !globalProps.isFirstParticipation &&
          correctResponsesTutorial >= correctResponsesLimitRepeatedTutorial &&
          !tutorialAlreadyCompleted,
        timeline: [
          {
            type: HtmlButtonResponsePlugin,
            stimulus: () =>
              globalProps.instructionLanguage === "en"
                ? [
                    `<p>You finished the tutorial with ${correctResponsesTutorial}/${numberOfTrialsRepeatedTutorial} correct responses.</p>`,
                  ]
                : [
                    `<p>Sie haben das Tutorial mit ${correctResponsesTutorial}/${numberOfTrialsRepeatedTutorial} richtigen Antworten abgeschlossen.</p>`,
                  ],
            choices: () =>
              globalProps.instructionLanguage === "en"
                ? ["Continue to the experiment"]
                : ["Weiter zum Experiment"],
          },
          {
            type: CallFunctionPlugin,
            func: () => {
              tutorialAlreadyCompleted = true;
              jsPsych.data.addProperties({
                tutorialCompletedSuccessfully: true,
              });
            },
          },
        ],
      },
      {
        conditional_function: () =>
          globalProps.isFirstParticipation &&
          correctResponsesTutorial < correctResponsesLimitTutorial &&
          index < maxRepetitionsTutorial,
        timeline: [
          {
            type: HtmlButtonResponsePlugin,
            stimulus: () =>
              globalProps.instructionLanguage === "en"
                ? [
                    `<p>You made too many mistakes in the tutorial (correct responses: ${correctResponsesTutorial}/${numberOfTrialsTutorial}). Please repeat it. You need at least ${correctResponsesLimitTutorial} correct responses to go on with the experiment.</p>`,
                  ]
                : [
                    `<p>Sie haben zu viele Fehler im Tutorial gemacht (richtige Antworten: ${correctResponsesTutorial}/${numberOfTrialsTutorial}). Bitte wiederholen Sie das Tutorial. Sie benötigen mindestens ${correctResponsesLimitTutorial} korrekte Antworten um mit dem Experiment fortzufahren.</p>`,
                  ],
            choices: () =>
              globalProps.instructionLanguage === "en"
                ? ["Repeat tutorial"]
                : ["Tutorial wiederholen"],
          },
          {
            type: CallFunctionPlugin,
            func: () => (correctResponsesTutorial = 0),
          },
        ],
      },
      {
        conditional_function: () =>
          !globalProps.isFirstParticipation &&
          correctResponsesTutorial < correctResponsesLimitRepeatedTutorial &&
          index < maxRepetitionsTutorial,
        timeline: [
          {
            type: HtmlButtonResponsePlugin,
            stimulus: () =>
              globalProps.instructionLanguage === "en"
                ? [
                    `<p>You made too many mistakes in the tutorial (correct responses: ${correctResponsesTutorial}/${numberOfTrialsRepeatedTutorial}). Please repeat it. You need at least ${correctResponsesLimitRepeatedTutorial} correct responses to go on with the experiment.</p>`,
                  ]
                : [
                    `<p>Sie haben zu viele Fehler im Tutorial gemacht (richtige Antworten: ${correctResponsesTutorial}/${numberOfTrialsRepeatedTutorial}). Bitte wiederholen Sie das Tutorial. Sie benötigen mindestens ${correctResponsesLimitRepeatedTutorial} korrekte Antworten um mit dem Experiment fortzufahren.</p>`,
                  ],
            choices: () =>
              globalProps.instructionLanguage === "en"
                ? ["Repeat tutorial"]
                : ["Tutorial wiederholen"],
          },
          {
            type: CallFunctionPlugin,
            func: () => (correctResponsesTutorial = 0),
          },
        ],
      },
      {
        conditional_function: () =>
          globalProps.isFirstParticipation &&
          correctResponsesTutorial < correctResponsesLimitTutorial &&
          index === maxRepetitionsTutorial,
        timeline: [
          {
            type: HtmlButtonResponsePlugin,
            stimulus: () =>
              globalProps.instructionLanguage === "en"
                ? [
                    `<p>You made too many mistakes in the tutorial (correct responses: ${correctResponsesTutorial}/${numberOfTrialsTutorial}). Please click the button below to finish the experiment.</p>`,
                  ]
                : [
                    `<p>Sie haben zu viele Fehler im Tutorial gemacht (richtige Antworten: ${correctResponsesTutorial}/${numberOfTrialsTutorial}). Bitte betätigen Sie die untenstehende Schaltfläche um das Experiment zu beenden.</p>`,
                  ],
            choices: () =>
              globalProps.instructionLanguage === "en"
                ? ["Finish experiment"]
                : ["Experiment abschließen"],
          },
          {
            type: CallFunctionPlugin,
            func: () =>
              jsPsych.data.addProperties({
                tutorialCompletedSuccessfully: false,
              }),
          },
          {
            type: CallFunctionPlugin,
            func: () =>
              globalProps.instructionLanguage === "en"
                ? [jsPsych.endExperiment("You have finished the experiment.")]
                : [jsPsych.endExperiment("Sie haben das Experiment beendet.")],
          },
        ],
      },
      {
        conditional_function: () =>
          !globalProps.isFirstParticipation &&
          correctResponsesTutorial < correctResponsesLimitRepeatedTutorial &&
          index === maxRepetitionsTutorial,
        timeline: [
          {
            type: HtmlButtonResponsePlugin,
            stimulus: () =>
              globalProps.instructionLanguage === "en"
                ? [
                    `<p>You made too many mistakes in the tutorial (correct responses: ${correctResponsesTutorial}/${numberOfTrialsRepeatedTutorial}). Please click the button below to finish the experiment.</p>`,
                  ]
                : [
                    `<p>Sie haben zu viele Fehler im Tutorial gemacht (richtige Antworten: ${correctResponsesTutorial}/${numberOfTrialsRepeatedTutorial}). Bitte betätigen Sie die untenstehende Schaltfläche um das Experiment zu beenden.</p>`,
                  ],
            choices: () =>
              globalProps.instructionLanguage === "en"
                ? ["Finish experiment"]
                : ["Experiment abschließen"],
          },
          {
            type: CallFunctionPlugin,
            func: () =>
              jsPsych.data.addProperties({
                tutorialCompletedSuccessfully: false,
              }),
          },
          {
            type: CallFunctionPlugin,
            func: () =>
              globalProps.instructionLanguage === "en"
                ? [jsPsych.endExperiment("You have finished the experiment.")]
                : [jsPsych.endExperiment("Sie haben das Experiment beendet.")],
          },
        ],
      }
    );
  }

  const makeBlockFinishedScreenTrial = (block, blockCount) => ({
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      if (block < blockCount) {
        return `<h1>Pause</h1><p>You finished block ${block} of ${blockCount}.<p/>`;
      } else {
        return "<p>This part of the experiment is finished.</p>";
      }
    },
    choices: ["Continue"],
  });

  // Questions which appear after the last block if it is the subject's last participation
  const lastParticipationSurvey = {
    conditional_function: () =>
      globalProps.isLastParticipation === true ||
      (IS_A_PROLIFIC_STUDY && IS_FINAL_QUESTIONNAIRE_ENABLED),
    timeline: [
      {
        type: SurveyTextPlugin,
        questions: () => {
          if (globalProps.instructionLanguage === "en") {
            return [
              {
                name: "What do you reckon we are investigating? What do you think might be the result of the study?",
                prompt:
                  "<p>What do you reckon we are investigating? What do you think might be the result of the study?</p>",
                required: true,
                rows: 10,
                columns: 60,
              },
            ];
          } else {
            return [
              {
                name: "Haben Sie eine Vermutung, was wir untersuchen und was herauskommen könnte?",
                prompt:
                  "<p>Haben Sie eine Vermutung, was wir untersuchen und was herauskommen könnte?</p>",
                required: true,
                rows: 10,
                columns: 60,
              },
            ];
          }
        },
      },
      {
        type: SurveyTextPlugin,
        questions: () => {
          if (globalProps.instructionLanguage === "en") {
            return [
              {
                name: "Please estimate: How often were negations (not red or not green) said in successive trials?",
                prompt:
                  '<p>Please estimate: How often were negations ("not red" or "not green") said in successive trials?</p>',
                required: true,
                rows: 10,
                columns: 60,
              },
              {
                name: "Do these negations follow a pattern?",
                prompt: "<p>Do these negations follow a pattern?</p>",
                required: true,
                rows: 10,
                columns: 60,
              },
            ];
          } else {
            return [
              {
                name: "Schätzen Sie: Wie häufig wurden Negationen (nicht rot oder nicht grün) in direkt aufeinanderfolgenden Durchgängen genannt?",
                prompt:
                  '<p>Schätzen Sie: Wie häufig wurden Negationen ("nicht rot" oder "nicht grün") in direkt aufeinanderfolgenden Durchgängen genannt?</p>',
                required: true,
                rows: 10,
                columns: 60,
              },
              {
                name: "Folgen die Negationen einem Muster?",
                prompt: "<p>Folgen die Negationen einem Muster?</p>",
                required: true,
                rows: 10,
                columns: 60,
              },
            ];
          }
        },
      },
      {
        type: SurveyTextPlugin,
        questions: () => {
          if (globalProps.instructionLanguage === "en") {
            return [
              {
                name: "Please estimate: How often were sentences without negation (now red or now green) said in successive trials?",
                prompt:
                  '<p>Please estimate: How often were sentences without negation ("now red" or "now green") said in successive trials?</p>',
                required: true,
                rows: 10,
                columns: 60,
              },
              {
                name: "Do these sentences follow a pattern?",
                prompt: "<p>Do these sentences follow a pattern?</p>",
                required: true,
                rows: 10,
                columns: 60,
              },
            ];
          } else {
            return [
              {
                name: "Schätzen Sie: Wie häufig wurden Sätze ohne Negation (jetzt rot oder jetzt grün) in direkt aufeinanderfolgenden Durchgängen genannt?",
                prompt:
                  '<p>Schätzen Sie: Wie häufig wurden Sätze ohne Negation ("jetzt rot" oder "jetzt grün") in direkt aufeinanderfolgenden Durchgängen genannt?</p>',
                required: true,
                rows: 10,
                columns: 60,
              },
              {
                name: "Folgen diese Sätze einem Muster?",
                prompt: "<p>Folgen diese Sätze einem Muster?</p>",
                required: true,
                rows: 10,
                columns: 60,
              },
            ];
          }
        },
      },
    ],
  };

  if (debugmode) {
    trials = trials.slice(0, 16); // only relevant if the original factors are used, resulting in a very large cartesian product
    debugPrint(trials, factors);
  }

  timeline.push(cursor_off);

  // Generator function to create the main experiment timeline
  const timelineGenerator = function* (blockCount, isAssertedFirst) {
    let currentBlock = 1;
    while (currentBlock <= blockCount) {
      yield {
        timeline: [toj],
        // Alternate between first half and second half of trials
        timeline_variables: isAssertedFirst
          ? currentBlock <= blockCount / 2
            ? trialsNegated
            : trialsAsserted
          : currentBlock <= blockCount / 2
          ? trialsAsserted
          : trialsNegated,
        randomize_order: true,
      };
      yield cursor_on;
      yield makeBlockFinishedScreenTrial(currentBlock, blockCount);
      yield cursor_off;
      currentBlock += 1;
    }
  };

  // Main experiment
  // Push first half and second half of trials to timeline.
  // The order (which half is negated and which half asserted) is switched at the second participation and switched back at the third participation.
  // Negated trials first half
  timeline.push({
    conditional_function: () =>
      (globalProps.isAssertedFirst &&
        !IS_A_PROLIFIC_STUDY &&
        (globalProps.isFirstParticipation || globalProps.isLastParticipation)) ||
      (globalProps.isAssertedFirst &&
        IS_A_PROLIFIC_STUDY &&
        (IS_STARTING_QUESTIONNAIRE_ENABLED || IS_FINAL_QUESTIONNAIRE_ENABLED)) ||
      (!globalProps.isAssertedFirst &&
        !IS_A_PROLIFIC_STUDY &&
        !globalProps.isFirstParticipation &&
        !globalProps.isLastParticipation) ||
      (!globalProps.isAssertedFirst &&
        IS_A_PROLIFIC_STUDY &&
        !IS_STARTING_QUESTIONNAIRE_ENABLED &&
        !IS_FINAL_QUESTIONNAIRE_ENABLED),
    timeline: Array.from(timelineGenerator(blockCount, true)),
  });
  // Asserted trials first half
  timeline.push({
    conditional_function: () =>
      (!globalProps.isAssertedFirst &&
        !IS_A_PROLIFIC_STUDY &&
        (globalProps.isFirstParticipation || globalProps.isLastParticipation)) ||
      (!globalProps.isAssertedFirst &&
        IS_A_PROLIFIC_STUDY &&
        (IS_STARTING_QUESTIONNAIRE_ENABLED || IS_FINAL_QUESTIONNAIRE_ENABLED)) ||
      (globalProps.isAssertedFirst &&
        !IS_A_PROLIFIC_STUDY &&
        !globalProps.isFirstParticipation &&
        !globalProps.isLastParticipation) ||
      (globalProps.isAssertedFirst &&
        IS_A_PROLIFIC_STUDY &&
        !IS_STARTING_QUESTIONNAIRE_ENABLED &&
        !IS_FINAL_QUESTIONNAIRE_ENABLED),
    timeline: Array.from(timelineGenerator(blockCount, false)),
  });

  timeline.push(cursor_on);

  timeline.push(lastParticipationSurvey);

  // final screen
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      if (IS_A_PROLIFIC_STUDY) {
        return globalProps.instructionLanguage === "en"
          ? [
              "<p>Thank you for participating. Continue to submit the results. You will be redirected to prolific.co.</p>",
            ]
          : [
              "<p>Vielen Dank für Ihre Teilnahme!</p><p>Fahren Sie fort, um die Resultate abzusenden. Sie werden anschließend zu prolific.co weitergeleitet.</p>",
            ];
      } else {
        return globalProps.instructionLanguage === "en"
          ? ["<p>Thank you for participating. Continue to submit the results.</p>"]
          : [
              "<p>Vielen Dank für Ihre Teilnahme!</p><p>Fahren Sie fort, um die Resultate abzusenden.</p>",
            ];
      }
    },
    choices: () => {
      if (IS_A_PROLIFIC_STUDY) {
        return globalProps.instructionLanguage === "en"
          ? ["Submit and continue to prolific.co"]
          : ["Resultate absenden und zu prolific.co fortfahren"];
      } else {
        return globalProps.instructionLanguage === "en"
          ? ["Submit the results"]
          : ["Resultate absenden"];
      }
    },
  });

  // Disable fullscreen
  timeline.push({
    type: FullscreenPlugin,
    fullscreen_mode: false,
  });
  await jsPsych.run(timeline);
  return jsPsych;
}

function debugPrint(trialVars, factors) {
  console.log("allTrials=");
  console.log(trialVars);

  let trialCount = 0;
  let curBlockIndex = 0;
  let currentBlockSize = 0;
  let sequenceLength = 0;
  let lastTrialIsNegated = trialVars[0].isInstructionNegated;

  let sequenceCount = {};
  factors.sequenceLength.forEach((seqLen) => {
    sequenceCount[seqLen] = 0;
  });

  let blockstring = "";
  trialVars.forEach((trial) => {
    if (trial.isInstructionNegated !== lastTrialIsNegated) {
      // instruction / utterance switched polarity
      // --> print sequence length
      blockstring += sequenceLength.toString();
      blockstring += lastTrialIsNegated ? "N " : "A ";

      sequenceCount[sequenceLength]++;

      lastTrialIsNegated = trial.isInstructionNegated;
      sequenceLength = 0;
    }

    if (curBlockIndex < trial["blockIndex"]) {
      console.log(blockstring);
      console.log("block_size=" + currentBlockSize + " block_index=" + curBlockIndex);
      currentBlockSize = 0;
      blockstring = "";

      curBlockIndex = trial["blockIndex"];
    }

    // sequence of negated/asserted statements is continued
    sequenceLength++;

    trialCount++;
    currentBlockSize++;
  });
  blockstring += sequenceLength.toString();
  blockstring += lastTrialIsNegated ? "N " : "A ";
  sequenceCount[sequenceLength]++;
  console.log(blockstring);
  console.log("block_size=" + currentBlockSize + " block_index=" + curBlockIndex);

  console.log("total_trials=" + trialCount);
  console.log("sequenceCount distinguished by sequenceLength:");
  console.log(sequenceCount);

  //SOA check: check how often SOAs were picked
  const asserted = 0;
  const negated = 1;
  let soas = [{}, {}];

  const createSoaTable = function (copyCount) {
    let map = {};
    factors.soa.forEach((key) => {
      map[key] = 0;
    });

    let res = [];
    for (let rank = 0; rank < copyCount; rank++) {
      res.push(copy(map));
    }
    return res;
  };

  // create 3-dimensional table to count used SOAs
  for (let i = 0; i < factors.sequenceLength.length; i++) {
    // use actual sequence length as key
    // for each utterance, sequence length and rank: add a list soas
    let seqLen = factors.sequenceLength[i]; // hier passieren sonderbare dinge
    soas[asserted][seqLen] = createSoaTable(seqLen);
    soas[negated][seqLen] = createSoaTable(seqLen);
  }

  trialVars.forEach((trial) => {
    let isNegated = trial.isInstructionNegated ? 1 : 0;
    soas[isNegated][trial.sequenceLength][trial.rank][trial.soa]++;
  });
  console.log(
    "soaCount, distinguished by asserted/negated, sequence length, rank of trial and SOA:"
  );
  console.log(soas);
}
