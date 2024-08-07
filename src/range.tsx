import { Workspace, Range } from './model';
import {checkIfInRange} from './utils'

const calculateRangeBorder = (dimension: number, position: number, rangeZone: number): number => {
  return Math.round(dimension * (Math.trunc((position + 0.5 * dimension) / dimension) + rangeZone));
}

const calculateRange = (workspace: Workspace): Range => {
  let scale = workspace.scale < 1 ? workspace.scale : 1;
  return {
      start: [
        calculateRangeBorder(workspace.width / scale, workspace.x, -2),
        calculateRangeBorder(workspace.height / scale, workspace.y, -2)
      ],
      end: [
        calculateRangeBorder(workspace.width / scale, workspace.x, 2),
        calculateRangeBorder(workspace.height / scale, workspace.y, 2)
      ]
  }
}

const checkIfRangeForUpdate = (workspace: Workspace, range: Range): boolean => {
  let scale = workspace.scale < 1 ? workspace.scale : 1;
  return (
    !checkIfInRange(workspace.x, range.start[0], range.start[0] + workspace.width / scale * 4)
      || !checkIfInRange(workspace.y, range.start[1], range.start[1] + workspace.height / scale * 4)
  )
}

export {calculateRange, checkIfRangeForUpdate};
