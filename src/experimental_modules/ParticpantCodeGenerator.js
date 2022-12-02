import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import { customAlphabet } from "nanoid";

export default (runtimeStateManager) => {
    return {
        type : HtmlButtonResponsePlugin,
        stimulus : () => {
            const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ123456789", 4);
            const participantCode = nanoid();
            runtimeStateManager.set("participantCode",participantCode)

            if (runtimeStateManager.instructionLanguage === "en") {
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
        choices : () => {
            return runtimeStateManager.instructionLanguage === "en"
            ? ["Done, let's continue"]
            : ["Ist gemacht, weiter!"]
        }
    }
}