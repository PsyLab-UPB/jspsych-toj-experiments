/**
 * @title TOJ Template
 * @description
 * @version 0.0.1
 * @imageDir images/common
 * @audioDir audio/color-toj-negation,audio/feedback
 * @miscDir misc
 */

"use strict";

import PreloadPlugin from "@jspsych/plugin-preload";
import { initJsPsych } from "jspsych";
import "../styles/main.scss";
import { ConditionGenerator } from "./util/ConditionGenerator";
import { CtxManager } from "./util/CtxManager";
import { Introduction } from "./util/introduction-template";
import { RuntimeStateManager } from "./util/RuntimeStateManager";
import IntroductionData from "./util/introduction.json";
import { toj } from "./util/StandartTOJ";
import { If } from "./experimental_modules/If";

export async function run({ assetPaths }) {
  const [
    basetimeline,
    trials,
    conditionGenerator,
    staticContextManager,
    runtimeStateManager,
    jsPsych,
  ] = init(assetPaths);

  let timeline = [
    ...basetimeline,

    ...new If(staticContextManager.get("SKIP_INTRODUCTION"))
      .Then([])
      .Else([Introduction(runtimeStateManager, staticContextManager)]),

    {
      timeline: [toj(conditionGenerator, jsPsych, staticContextManager)],
      timeline_variables: trials.slice(0, 10),
      play_feedback: true,
      randomize_order: true,
    },
    
  ];

  await jsPsych.run(timeline);
  return jsPsych;
}

function settings(jsPsych) {
  const factors = {
    probeLeft: [true, false],
    soa: [-10, -7, -5, -3, -1, 0, 1, 3, 5, 7, 10].map((x) => x * 10),
  };
  const repetitions = 2;
  let trials = jsPsych.randomization.factorial(factors, repetitions);
  const conditionGenerator = new ConditionGenerator();
  const staticContextManager = new CtxManager(true, false, IntroductionData, {
    IS_STARTING_QUESTIONNAIRE_ENABLED: true,
    IS_FINAL_QUESTIONNAIRE_ENABLED: false,
    SKIP_INTRODUCTION: true,
    LEFT_KEY: "q",
    RIGHT_KEY: "p",
  });
  const runtimeStateManager = new RuntimeStateManager(jsPsych, { instructionLanguage: "Lang" });
  return [trials, conditionGenerator, staticContextManager, runtimeStateManager];
}

function init(assetPaths) {
  const jsPsych = initJsPsych();
  const [trials, conditionGenerator, staticContextManager, runtimeStateManager] = settings(jsPsych);
  let timeline = [{ type: PreloadPlugin, audio: assetPaths.audio }];
  return [timeline, trials, conditionGenerator, staticContextManager, runtimeStateManager, jsPsych];
}
