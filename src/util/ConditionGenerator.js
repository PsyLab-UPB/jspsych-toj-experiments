import shuffle from "lodash/shuffle";
import { LabColor } from "./colors";
import sample from "lodash/sample";
import randomInt from "random-int";

export class ConditionGenerator {
  static gridSize = 7;

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

  mirrorOrientation(orientation) {
    return (orientation + 90) % 180;
  }

  static _generateRandomPos(xRange, yRange) {
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

  generateCondition(probeLeft) {
    const condition = {};

    /*const [colorDegLeft, colorDegRight] = shuffle([-90, 90]);
    condition.colorLeft = new LabColor(colorDegLeft);
    condition.colorRight = new LabColor(colorDegRight);
    condition.probeColorDegOffset = sample([-60, 60, -120, 120]);

    if (probeLeft) {
      condition.colorProbe = condition.colorLeft.getRelativeColor(condition.probeColorDegOffset);
      condition.colorProbeGrid = condition.colorLeft;
      condition.colorReference = condition.colorRight;
    } else {
      condition.colorProbe = condition.colorRight.getRelativeColor(condition.probeColorDegOffset);
      condition.colorProbeGrid = condition.colorRight;
      condition.colorReference = condition.colorLeft;
    }
    */
    condition.colorLeft = "rgb(0,0,0)"
    condition.colorRight = "rgb(0,0,0)"
    condition.colorProbe = "rgb(259,259,259)"
    condition.colorReference = "rgb(259,259,259)"
    condition.colorProbeGrid = condition.colorLeft;
    condition.colorReference = condition.colorRight;

    condition.rotationProbe = this.generateOrientation();
    condition.rotationReference = this.mirrorOrientation(condition.rotationProbe);

    const posLeft = this.generatePosition("left", [3, 5]);
    const posRight = this.generatePosition("right", [2, 4]);
    if (probeLeft) {
      condition.posProbe = posLeft;
      condition.posRef = posRight;
    } else {
      condition.posProbe = posRight;
      condition.posRef = posLeft;
    }

    condition.fixationTime = randomInt(30, 75) * 10;
    return condition;
  }
}