/**
 * A jsPsych plugin for temporal order judgement tasks
 * extensions: negation through voice + judge whether first or second
 *
 * @author bjoluc and Psylab UPB
 * @version 2.0.0
 * @license MIT
 */

"use strict";

import { playAudio } from "../util/audio";
import { TojPlugin } from "./TojPlugin";

import { ParameterType } from "jspsych";

export class WhichFirstTojPlugin extends TojPlugin {
  static info = {
    name: "toj-which_first",
    parameters: {
      ...TojPlugin.info.parameters,
      instruction_filename: {
        type: ParameterType.STRING,
        pretty_name: "Instruction filename",
        default: null,
        description: "The filename (basename only) of the property to be used in the instruction",
      },
      instruction_negated: {
        type: ParameterType.STRING,
        pretty_name: "Instruction negated",
        default: null,
        description: "Whether the instruction is negated or not",
      },
      instruction_language: {
        type: ParameterType.STRING,
        pretty_name: "Instruction language",
        default: null,
        description: "The language ('en' or 'de') of the instruction",
      },
      instruction_voice: {
        type: ParameterType.STRING,
        pretty_name: "Instruction voice",
        default: null,
        description: "The voice of the instruction ('m' or 'f')",
      },
    },
  };

  async trial(display_element, trial, on_load, appendContainer = true) {
    TojPlugin.current = this;

    this._appendContainerToDisplayElement(display_element, trial);
    on_load();

    // Play instruction
    const audioBaseUrl = `media/audio/color-toj-negation/${trial.instruction_language}/${trial.instruction_voice}/`;
    await playAudio(audioBaseUrl + (trial.instruction_negated ? "not" : "now") + ".wav");
    await playAudio(audioBaseUrl + trial.instruction_filename + ".wav");

    await super.trial(display_element, trial, on_load, false);
  }
}

export default WhichFirstTojPlugin;
