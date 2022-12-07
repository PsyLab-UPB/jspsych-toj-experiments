/**
 * A jsPsych plugin for temporal order judgement tasks
 * extensions: negation through voice + judge whether first or second
 *
 * @author bjoluc and Psylab UPB
 * @version 1.0.0
 * @license MIT
 */

"use strict";

import delay from "delay";
import { ParameterType } from "jspsych";
import { playAudio } from "../util/audio";
import { TojPlugin } from "./TojPlugin";
import * as $ from "jquery";

enum TargetType {
  FIRST = "first",
  SECOND = "second",
}
let start = Number.POSITIVE_INFINITY
let active = false
let clickcounter = 0
function animateCircle(e){
    if(active && (!e.keyCode || e.keyCode === 32)) {
      //console.log("keydown");
      if(!Number.isFinite(start)){
        start = new Date().getTime()
        console.log("here")
        $("#countdown circle").width();
        $("#countdown circle").addClass("run")
        if(clickcounter == 0){
          clickcounter = 1
        }
        else if(clickcounter == 2){
          clickcounter = 3
        }
        
      }     
    }
}

export class TojPluginWhichFirst extends TojPlugin {
  static newTouchMode = true;

  static info = <any>{
    name: "toj-which_first",
    parameters: {
      ...TojPlugin.info.parameters,
      first_key: {
        type: ParameterType.KEY,
        pretty_name: "First key",
        default: undefined,
        description: "The key that the subject uses to give a queried stimulus was first response",
      },
      second_key: {
        type: ParameterType.KEY,
        pretty_name: "Second key",
        default: undefined,
        description: "The key that the subject uses to give a queried stimulus was second response",
      },
      first_touch_element: {
        type: ParameterType.OBJECT,
        pretty_name: "touch element first",
        default: null,
      },
      second_touch_element: {
        type: ParameterType.OBJECT,
        pretty_name: "touch element second",
        default: null,
      },
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

  async trial(display_element, trial, on_load) {
    if (!$("#countdown").length){
      $("body").append("<div id='countdown' class='countdown'><div id='countdown-number'></div><svg><circle r='18' cx='20' cy='20'></circle></svg></div")
    }
    TojPlugin.current = <any>this;

    this._appendContainerToDisplayElement(display_element, trial);
    on_load();

    // Play instruction
    const audioBaseUrl = `media/audio/color-toj-negation/${trial.instruction_language}/${trial.instruction_voice}/`;
    await playAudio(audioBaseUrl + (trial.instruction_negated ? "not" : "now") + ".wav");
    await playAudio(audioBaseUrl + trial.instruction_filename + ".wav");

    await delay(trial.fixation_time);

    // Modify stimulus elements according to SOA
    await TojPluginWhichFirst.doTojModification(
      trial.probe_element,
      trial.reference_element,
      trial.modification_function,
      trial.soa
    );

    const responseStartTime = performance.now();

    let firstResponse;
    let secondResponse;

    let firstResponse2;

    if (TojPluginWhichFirst.newTouchMode) {
      firstResponse = new Promise<TargetType>((resolve) => {
        var longpress = 1000;
        // holds the start tim
        $(document).on("mousedown", animateCircle);

        $(document).on("mouseleave", function (e) {
          start = Number.POSITIVE_INFINITY;
        });

        $(document).on("mouseup", function (e) {
          if (new Date().getTime() >= start + longpress) {
            $("#countdown circle").removeClass("run")
            active = false
            resolve(TargetType.FIRST);
          } else {
            $("#countdown circle").removeClass("run")
            start = Number.POSITIVE_INFINITY
          }
        });
      });

      secondResponse = new Promise<TargetType>((resolve) => {
        $(display_element).dblclick(function () {
          //console.log('double tap!');
          resolve(TargetType.SECOND);
        });
      });

      firstResponse2 = new Promise<TargetType>((res) => {
        var longpress = 1000;
        // holds the start time
        active = true
        start = Number.POSITIVE_INFINITY;
        clickcounter = 0
        $(document).keydown(animateCircle);

        $(document).on("mouseleave", function (e) {
          if(e.keyCode === 32) {
            start = Number.POSITIVE_INFINITY;
          }
        });

        $(document).on("keyup", function (e) {
          if (e.keyCode === 32 && new Date().getTime() >= start + longpress) {
            $("#countdown circle").removeClass("run")
            active = false
            res(TargetType.FIRST);
          } else if(e.keyCode === 32) {
            $("#countdown circle").removeClass("run")
            start = Number.POSITIVE_INFINITY
          }
        });
        $(document).on("keyup", function (e) {
          if(e.keyCode === 32){
            if(clickcounter == 1){
              clickcounter = 2
              setTimeout(() => clickcounter = 0, 500)
            }
            else if(clickcounter == 3){
              console.log("double space tab")
              res(TargetType.SECOND);
            }
          }
        })
      })
    } else {
      firstResponse = new Promise<TargetType>((resolve) => {
        (trial.first_touch_element as HTMLElement)?.addEventListener("touchstart", () => {
          resolve(TargetType.FIRST);
        });
      });

      secondResponse = new Promise<TargetType>((resolve) => {
        (trial.second_touch_element as HTMLElement)?.addEventListener("touchstart", () => {
          resolve(TargetType.SECOND);
        });
      });
      firstResponse2 = new Promise<TargetType>((resolve, reject) => {
      })
    }

    const response = await Promise.race([
      this.getKeyboardResponsePromisified({
        valid_responses: [trial.first_key, trial.second_key],
        rt_method: "performance",
        persist: false,
        allow_held_key: false,
      }).then((result) => {
        return Promise.resolve(
          result.key === trial.first_key ? TargetType.FIRST : TargetType.SECOND
        );
      }),
      firstResponse,
      secondResponse,
      firstResponse2
    ]);

    const responseEndTime = performance.now();

    // Clear the screen
    display_element.innerHTML = "";

    // the probe is the stimuli that is being instructed to attend.
    // Instruction "not red" --> probe is green. Instruction "now red" --> probe is red.
    let isProbeFirst = trial.soa < 0;
    let correct = isProbeFirst === (response === TargetType.FIRST) || trial.soa === 0;

    const resultData = Object.assign({}, trial, {
      response_key: response === TargetType.FIRST ? trial.first_key : trial.second_key,
      response: response,
      response_correct: correct,
      rt: Math.round(responseEndTime - responseStartTime),
    });

    if (trial.play_feedback) {
      await playAudio(`media/audio/feedback/${correct ? "right" : "wrong"}.wav`);
    }

    // Finish trial and log data
    this.jsPsych.finishTrial(resultData);
  }
}

export default TojPluginWhichFirst;
