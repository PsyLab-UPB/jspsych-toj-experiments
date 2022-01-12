/**
 * @title Color TOJ Negation 5
 * @description Experiment on negation in TVA instructions (dual-colored version, copy of experiment 3 (paper: 1b) with well-defined assertion/negation sequence lengths (formerly only random lengths) and fewer SOAs).
 * - Includes improvements:
 * - new declaration of consent, conforming DSGVO
 * - note about color vision deficiency + linking to a self-check
 * - instructions to turn screen into landscape mode
 * - instructions about deactivating blue light filters
 * - instructions about deactivating blue light dark mode
 * - Instructions to turn on sound and sound test (still to be done)
 * - Experiment after a pause is continued by pressing the space bar, not by pressing any key
 * @version 1.1.0
 * @imageDir images/common
 * @audioDir audio/color-toj-negation,audio/feedback
 * @miscDir misc
 */

"use strict";

import "../styles/main.scss";


// jsPsych plugins
import "jspsych/plugins/jspsych-html-keyboard-response";
import "jspsych/plugins/jspsych-image-keyboard-response";
import "jspsych/plugins/jspsych-call-function";
//import "jspsych/plugins/jspsych-preload";

import { TojPlugin } from "./plugins/jspsych-toj";
import tojNegationPlugin from "./plugins/jspsych-toj-negation-dual";
import "./plugins/jspsych-toj-negation-dual";

import delay from "delay";
import { sample } from "lodash";
import randomInt from "random-int";

import { TouchAdapter } from "./util/TouchAdapter";
import { Scaler } from "./util/Scaler";
import { createBarStimulusGrid } from "./util/barStimuli";
import { setAbsolutePosition } from "./util/positioning";
import { LabColor } from "./util/colors";
import { Quadrant } from "./util/Quadrant";
import { addIntroduction } from "./util/introduction";

// const soaChoices = [-6, -3, -1, 0, 1, 3, 6].map((x) => (x * 16.6667).toFixed(3));
const soaChoices = [-3, 0, 3].map((x) => (x * 16.6667).toFixed(3));
const soaChoicesTutorial = [-6, -3, 3, 6].map((x) => (x * 16.6667).toFixed(3));

const debugmode = false;

class TojTarget {
  /**
   * The target's color
   * @type {LabColor}
   */
  color;

  /**
   * The quadrant in which the target is displayed
   * @type {Quadrant}
   */
  quadrant;

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
   * The size ([x, y]) of the grid in one quadrant
   */
  static gridSize = [7, 4];

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
    const targetPairs = [];

    // Choose quadrants for targets
    const quadrantPairs = Quadrant.getRandomMixedSidePairs();

    // Generate information for two pairs of targets
    for (let pairIndex = 0; pairIndex < 2; pairIndex++) {
      // Create a target pair
      const primary = new TojTarget();
      const secondary = new TojTarget();

      primary.quadrant = quadrantPairs[pairIndex][0];
      secondary.quadrant = quadrantPairs[pairIndex][1];

      primary.color =
        pairIndex == 0
          ? ConditionGenerator.getRandomPrimaryColor()
          : targetPairs[0].primary.color.getRelativeColor(180);
      secondary.color = primary.color.getRandomRelativeColor([alpha, -alpha]);

      // Set isProbe
      primary.isProbe = probeLeft ? primary.quadrant.isLeft() : !primary.quadrant.isLeft();
      secondary.isProbe = !primary.isProbe;

      [primary, secondary].map((target) => {
        target.gridPosition = ConditionGenerator.generateRandomPos(
          target.quadrant.isLeft() ? [2, 5] : [1, 4],
          [1, 2]
        );
      });

      targetPairs[pairIndex] = { pairIndex, primary, secondary, fixationTime: randomInt(300, 500) };
    }

    return {
      targetPairs,
      rotation: this.generateOrientation(),
      distractorSOA: sample(soaChoices),
    };
  }
}

const conditionGenerator = new ConditionGenerator();

const leftKey = "q",
  rightKey = "p";

export function createTimeline() {
  let timeline = [];

  jsPsych.pluginAPI.preloadImages([
    "media/images/common/tw.png",
    "media/images/common/ntw.png"]);

  const touchAdapterSpace = new TouchAdapter(
    jsPsych.pluginAPI.convertKeyCharacterToKeyCode("space")
  );
  const bindSpaceTouchAdapterToWindow = async () => {
    await delay(500); // Prevent touch event from previous touch
    touchAdapterSpace.bindToElement(window);
  };
  const unbindSpaceTouchAdapterFromWindow = () => {
    touchAdapterSpace.unbindFromElement(window);
  };

  const globalProps = addIntroduction(timeline, {
    skip: true,
    experimentName: "Color TOJ Negation 5",
    instructions: {
      en: `
You will see a grid of bars and a point in the middle. Please try to focus at the point during the whole experiment.
Four of the bars are colored (red or green), where there are two pairs of similarly colored bars.
At the beginning of each trial, you will hear an instruction like "now red" or "not green".
This informs you which of the two pairs of bars is relevant for the respective trial; you can ignore the other pair then.
Successively, each of the colored bars will flash once.
Based on this, your task is to decide which of the two relevant bars has flashed first.

If it was the left one, press **Q** (or tap on the left half of your screen).
If it was the right one, press **P** (or tap on the right half of your screen).

Please try to be as exact as possible and avoid mistakes.
If it is not clear to you whether the left or the right bar flashed earlier, you may guess the answer.

The experiment will start with a tutorial in which a sound at the end of each trial will indicate whether your answer was correct or not.
Note that the playback of audio may be delayed for some of the first trials.
      `,
      de: `
Sie sehen gleich ein Muster aus Strichen und einen Punkt in der Mitte. Schauen sie möglichst während des gesamten Experimentes auf diesen Punkt.
Vier dieser Striche sind farbig (rot oder grün), wobei es jeweils zwei Paare von Strichen ähnlicher Farbe gibt.
Am Anfang jedes Durchgangs hören Sie eine Anweisung wie "jetzt rot" oder "nicht grün".
Diese sagt Ihnen, welches der beiden Paare für die weitere Aufgabe relevant ist; das jeweils andere Paar brauchen Sie nicht zu beachten.
Anschließend wird jeder der farbigen Striche kurz blinken.
Ihre Aufgabe ist es, zu entscheiden, welcher der beiden Striche des relevanten Paares zuerst geblinkt hat.

War es der linke, drücken Sie **Q** (oder tippen auf die linke Bildschirmhälfte).
War es der rechte, drücken Sie **P** (oder tippen auf die rechte Bildschirmhälfte).

Versuchen Sie, genau zu sein und keine Fehler zu machen.
Wenn Sie nicht wissen, welcher Strich zuerst blinkte, raten Sie.

Das Experiment beginnt mit einem Tutorial, bei dem Ihnen die Korrektheit jeder Antwort durch ein Geräusch rückgemeldet wird.
Die Audiowiedergabe kann bei den ersten Durchgängen leicht verzögert sein.
      `,
    },
  });

  /** 
  // Generate trials
  const factors = {
    isInstructionNegated: [true, false],
    probeLeft: [true, false],
    soa: soaChoices,
    sequenceLength: [1, 2, 5],
  };
  const factorsTutorial = {
    isInstructionNegated: [true, false],
    soa: soaChoicesTutorial,
    sequenceLength: [1, 2, 5],
  };
  const factorsDebug = {
    isInstructionNegated: [true, false],
    soa: [-6, 6].map((x) => (x * 16.6667).toFixed(3)),
    sequenceLength: [1, 2],
  };
  const repetitions = 1;
  const blocksize = 40;
  const probeLeftIsFactor = true; // if true, it adds an implicit repetition
  const alwaysStayUnderBlockSize = false;
 
 
  let trialData = generateAlternatingSequences(
    factors,
    repetitions,
    probeLeftIsFactor,
    blocksize,
    alwaysStayUnderBlockSize
  );

  if (debugmode) {
    trialData = generateAlternatingSequences(factorsDebug, 1, false, 1, false);
  } */

  const factors = {
    isInstructionNegated: [true, false],
    probeLeft: [true, false],
    trust: [
      "media/images/common/tw.png",
      "media/images/common/ntw.png"], //,      "media/images/common/tw1.png",       "media/images/common/ntw1.png"],
    soa: soaChoices,
  };
  const factorsTutorial = {
    isInstructionNegated: [true, false],
    probeLeft: [true, false],
    trust: [
      "media/images/common/tw.png",
      "media/images/common/ntw.png"],//,      "media/images/common/tw1.png",      "media/images/common/ntw1.png"],
    soa: soaChoicesTutorial,
  };  


  const repetitions = 2;
 

  let trialData = jsPsych.randomization.factorial(factors, repetitions);

  //let trials = trialData.trials;
  // let blockCount = trialData.blockCount;

  const touchAdapterLeft = new TouchAdapter(
    jsPsych.pluginAPI.convertKeyCharacterToKeyCode(leftKey)
  );
  const touchAdapterRight = new TouchAdapter(
    jsPsych.pluginAPI.convertKeyCharacterToKeyCode(rightKey)
  );

  let scaler; // Will store the Scaler object for the TOJ plugin

  // Create TOJ plugin trial object
  const toj = {
    type: "toj-negation-dual",
    modification_function: (element) => TojPlugin.flashElement(element, "toj-flash", 30),
    soa: jsPsych.timelineVariable("soa"),
    probe_key: () => (jsPsych.timelineVariable("probeLeft", true) ? leftKey : rightKey),
    reference_key: () => (jsPsych.timelineVariable("probeLeft", true) ? rightKey : leftKey),
    instruction_negated: jsPsych.timelineVariable("isInstructionNegated"),
    instruction_voice: () => sample(["m", "f"]),
    trust: jsPsych.timelineVariable("trust"),
    //blockC: timelineVariable('blockCount'),
    on_start: async (trial) => {
      const probeLeft = jsPsych.timelineVariable("probeLeft", true);
      const cond = conditionGenerator.generateCondition(probeLeft);

      // Log probeLeft and condition
      trial.data = {
        probeLeft,
        condition: cond,
     //   sequenceLength: jsPsych.timelineVariable("sequenceLength", true),
        rank: jsPsych.timelineVariable("rank", true),
        blockIndex: jsPsych.timelineVariable("blockIndex", true),
        trialIndexInThisTimeline: jsPsych.timelineVariable("trialIndex", true),
        trialIndexInThisBlock: jsPsych.timelineVariable("trialIndexInBlock", true),
      };

      trial.fixation_time = cond.targetPairs[0].fixationTime;
      trial.distractor_fixation_time = cond.targetPairs[1].fixationTime;
      trial.instruction_language = globalProps.instructionLanguage;

      const gridColor = "#777777";

      // Loop over targets, creating them and their grids in the corresponding quadrants
      for (const targetPair of cond.targetPairs) {
        [targetPair.primary, targetPair.secondary].map((target) => {
          const [gridElement, targetElement] = createBarStimulusGrid(
            ConditionGenerator.gridSize,
            target.gridPosition,
            target.color.toRgb(),
            gridColor,
            1,
            0.7,
            0.1,
            cond.rotation
          );
          tojNegationPlugin.appendElement(gridElement);
          (target.quadrant.isLeft() ? touchAdapterLeft : touchAdapterRight).bindToElement(
            gridElement
          );

          setAbsolutePosition(
            gridElement,
            (target.quadrant.isLeft() ? -1 : 1) * ConditionGenerator.gridSize[0] * 20,
            (target.quadrant.isTop() ? -1 : 1) * ConditionGenerator.gridSize[1] * 20
          );

          // Specify the elements for TOJ
          if (targetPair.pairIndex == 0) {
            // Task-relevant target pair
            if (target.isProbe) {
              trial.probe_element = targetElement;
            } else {
              trial.reference_element = targetElement;
            }
          } else {
            // Distracting target pair
            if (target.isProbe) {
              trial.distractor_probe_element = targetElement;
            } else {
              trial.distractor_reference_element = targetElement;
            }
          }
        });
      }

      // Set instruction color
      trial.instruction_filename =
        cond.targetPairs[trial.instruction_negated ? 1 : 0].primary.color.toName();

      // Set distractor SOA
      trial.distractor_soa = cond.distractorSOA;
    },
    on_load: async () => {
      // Fit to window size
      scaler = new Scaler(
        document.getElementById("jspsych-toj-container"),
        ConditionGenerator.gridSize[0] * 40 * 2,
        ConditionGenerator.gridSize[1] * 40 * 2,
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
      if (!globalProps.isFirstParticipation) {
        if ((data["play_feedback"] === true) & (data["trialIndexInThisBlock"] >= 9)) {
          // do not continue after the 10th warm-up trial if participant is already familiar with the experiment
          jsPsych.endCurrentTimeline();
        }
      }
    },
  };

  

  const cursor_off = {
    type: "call-function",
    func: function () {
      document.body.style.cursor = "none";
    },
  };

  const cursor_on = {
    type: "call-function",
    func: function () {
      document.body.style.cursor = "auto";
    },
  };

  // Tutorial
  let trialDataTutorial = jsPsych.randomization.factorial(factorsTutorial, repetitions); //generateAlternatingSequences(factorsTutorial, 5, true); // generate trials with larger SOAs in tutorial
  //let trialsTutorial = trialDataTutorial.trials//.slice(0, 3); //debugmode ? 10 : 30);
  //let trialsTutorial = trials.slicetrials.slice(0, debugmode ? 10 : 30); // or duplicate trials that are actually used

  // Versuch1

 /** const preload = {
    type: "preload",
    auto_preload: true
    //images: ['media/images/common/tw.png', 'media/images/common/ntw.png']
  };
  //timeline.push(preload);
*/
  const cross = {
    type: "html-keyboard-response",
    stimulus: '<div style="font-size:60px;">+</div>',
    choices: "NO_KEYS",
    trial_duration: 1000,
  };

  /**   const face = {
    type: "html-keyboard-response",
    stimulus: "<img src='"+jsPsych.timelineVariable("trust")+"'>)",
    choices: "NO_KEYS",

   // stimulus_height: 300,
    trial_duration: 700,
  };
 */
  const face = {
    type: "image-keyboard-response",
    stimulus: jsPsych.timelineVariable("trust"),
    stimulus_height: 300,
    trial_duration: 700,
  };

  //timeline.push(preload);
  timeline.push(
    cursor_off,
    {
      timeline: [cross, face, toj],
      timeline_variables: trialDataTutorial.slice(0, 5),//trialsTutorial,
      play_feedback: true,
    },
    cursor_on,
    {
      type: "html-keyboard-response",
      choices: [" "],
      stimulus: "<p>You finished the tutorial.</p><p>Press SPACE key or touch to continue.</p>",
      /*on_start: bindSpaceTouchAdapterToWindow,
      on_finish: unbindSpaceTouchAdapterFromWindow,*/
    }
  );
  
  

  // The trials array contains too many items for a block, so we divide the conditions into two
  // blocks. BUT: We cannot easily alternate between the first half and the second half of the
  // trials array in the `experimentTojTimeline` because the timeline_variables property does not
  // take a function. Hence, we manually create all timeline entries instead of using nested
  // timelines. :|

  const makeBlockFinishedScreenTrial = (block, blockCount) => ({
    type: "html-keyboard-response",
    choices: () => {
      if (block < blockCount) {
        return [" "];
      } else {
        return jsPsych.ALL_KEYS;
      }
    },
    stimulus: () => {
      if (block < blockCount) {
        return `<h1>Pause</h1><p>You finished block ${block} of ${blockCount}.<p/><p>Press SPACE key or touch to continue.</p>`;
      } else {
        return "<p>This part of the experiment is finished. Press any key or touch to submit the results!</p>";
      }
    },
    /*on_start: bindSpaceTouchAdapterToWindow,
    on_finish: unbindSpaceTouchAdapterFromWindow,*/
  });

  let curBlockIndex = 0;

  timeline.push(cursor_off);

  // calculate how much trials are needed to run all combinations
  const singleRunTrialCount =  Object.getOwnPropertyNames(factors).map((factorName) => factors[factorName].length).reduce((acc,value) => (acc*value),1)
  const blockLengthLimit = singleRunTrialCount

  for (let i = 0; i < trialData.length; i++) {
    let trial = trialData[i];

    const experimentTojTimeline = {
      timeline: [toj],
      timeline_variables: [trial]
    };
    timeline.push(experimentTojTimeline);

    // if last trial in block
    if(i % blockLengthLimit === blockLengthLimit - 1){
      timeline.push(cursor_on);
      timeline.push(makeBlockFinishedScreenTrial(curBlockIndex + 1, Math.ceil(singleRunTrialCount*repetitions/blockLengthLimit)));
      curBlockIndex ++
      timeline.push(cursor_off);
    }
  }
  timeline.push(cursor_on);

  // Disable fullscreen
  timeline.push({
    type: "fullscreen",
    fullscreen_mode: false,
  });
  console.log(timeline)
  return timeline;
}