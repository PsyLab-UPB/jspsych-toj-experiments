import CallFunctionPlugin from "@jspsych/plugin-call-function";
import estimateVsync from "vsync-estimate";

export function DevicePropsCheck(runtimeStateManager)
{
    return {
        type : CallFunctionPlugin,
        
        func : () => {
            estimateVsync().then(rate => {
                const userAgent = navigator.userAgent;
                runtimeStateManager.set("refreshRate",rate)
                runtimeStateManager.set("userAgent",userAgent)
            })
        }
    }

  }