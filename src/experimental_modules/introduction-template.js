import { DebugCall } from "./debugCall";
import { MultiLanguageSurveyShortCut } from "./MultiLanguageSurveyShortCut";
import { If } from "./If";
import ParticpantCodeGenerator from "./ParticpantCodeGenerator";
import { DevicePropsCheck } from "./DevicePropsCheck";

export function Introduction(runtimeStateManager, staticContextManager) {
  let timeline = [
    new DebugCall(staticContextManager),
    DevicePropsCheck(runtimeStateManager),

    ...MultiLanguageSurveyShortCut(
      ["Lang", "FirstParticipation"],
      staticContextManager.replacementDict,
      runtimeStateManager
    ),

    ...MultiLanguageSurveyShortCut(
      ["DeclarationOfConsent", "BlueLightFilters", "DarkMode", "ColorVision", "ComputerSound"],
      staticContextManager.replacementDict,
      runtimeStateManager
    ),
    ...new If(runtimeStateManager.isTrue("FirstParticipation"))
      .Then([ParticpantCodeGenerator(runtimeStateManager)])
      .Else(
        MultiLanguageSurveyShortCut(
          ["ParticipantCodeReq"],
          staticContextManager.replacementDict,
          runtimeStateManager
        )
      ),
    ...new If(runtimeStateManager.isTrue("FirstParticipation"))
      .Then(
        MultiLanguageSurveyShortCut(
          ["Age", "Gender"],
          staticContextManager.replacementDict,
          runtimeStateManager
        ),
      )
      .Else([]),
  ];

  return { timeline: timeline };
}
