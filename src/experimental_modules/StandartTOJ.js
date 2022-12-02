import TojPlugin from "../plugins/TojPlugin";
import { ConditionGenerator } from "./ConditionGenerator";
import { createBarStimulusGrid } from "./barStimuli";
import { setAbsolutePosition } from "./positioning";
import { Scaler } from "./Scaler";
import { TouchAdapter } from "./TouchAdapter";

export function toj(conditionGenerator, jsPsych, staticContextManager) {
    let scaler = undefined
    const touchAdapterLeft = new TouchAdapter(staticContextManager.OPTIONS.LEFT_KEY);
    const touchAdapterRight = new TouchAdapter(staticContextManager.OPTIONS.RIGHT_KEY);
    return {
        type: TojPlugin,
        modification_function: (element) => TojPlugin.flashElement(element, "toj-flash", 30),
        soa: jsPsych.timelineVariable("soa"),
        probe_key: () => (jsPsych.timelineVariable("probeLeft") ? staticContextManager.OPTIONS.LEFT_KEY : staticContextManager.OPTIONS.RIGHT_KEY),
        reference_key: () => (jsPsych.timelineVariable("probeLeft") ? staticContextManager.OPTIONS.RIGHT_KEY : staticContextManager.OPTIONS.LEFT_KEY),
        on_start: (trial) => {
            const probeLeft = jsPsych.timelineVariable("probeLeft");
            const condition = conditionGenerator.generateCondition(probeLeft);

            // Log probeLeft and condition
            trial.data = {
                probeLeft,
                condition,
            };

            trial.fixation_time = condition.fixationTime;
        },
        on_load: () => {
            const trial = jsPsych.getCurrentTrial();
            const { condition, probeLeft } = trial.data;

            const plugin = TojPlugin.current;

            const gridSize = [ConditionGenerator.gridSize, ConditionGenerator.gridSize];
            const targetScaleFactor = 1;
            const distractorScaleFactor = 0.7;
            const distractorScaleFactorSD = 0.1;

            const [probeGrid, probeTarget] = createBarStimulusGrid(
                gridSize,
                condition.posProbe,
                condition.colorReference,
                condition.colorProbe,
                targetScaleFactor,
                distractorScaleFactor,
                distractorScaleFactorSD,
                0
            );
            const [referenceGrid, referenceTarget] = createBarStimulusGrid(
                gridSize,
                condition.posRef,
                condition.colorReference,
                condition.colorProbe,
                targetScaleFactor,
                distractorScaleFactor,
                distractorScaleFactorSD,
                0
            );

            (probeLeft ? touchAdapterLeft : touchAdapterRight).bindToElement(probeGrid);
            (probeLeft ? touchAdapterRight : touchAdapterLeft).bindToElement(referenceGrid);

            trial.probe_element = probeTarget;
            trial.reference_element = referenceTarget;
            trial.probe_touch_element = probeGrid;
            trial.reference_touch_element = referenceGrid;

            plugin.appendElement(probeGrid);
            plugin.appendElement(referenceGrid);
            setAbsolutePosition(probeGrid, (probeLeft ? -1 : 1) * 140);
            setAbsolutePosition(referenceGrid, (probeLeft ? 1 : -1) * 140);

            // Fit to window size
            scaler = new Scaler(
                plugin.container,
                ConditionGenerator.gridSize * 40 * 2,
                ConditionGenerator.gridSize * 40,
                10
            );
        },
        on_finish: () => {
            scaler.destruct();
            touchAdapterLeft.unbindFromAll();
            touchAdapterRight.unbindFromAll();
        },
    }
};