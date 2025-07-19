import { checkIfInRange } from './common'

const calculateRangeBorder = (dimension, position, rangeZone) => {
  return Math.round(dimension * (Math.trunc((position + 0.5 * dimension) / dimension) + rangeZone));
}

const calculateRange = (pos, scale) => {
  scale = Math.max(1 / scale, 1);

  return {
      start: {
        x: calculateRangeBorder(outerWidth * scale, pos.x, -2),
        y: calculateRangeBorder(outerHeight * scale, pos.y, -2)
      },
      end: {
        x: calculateRangeBorder(outerWidth * scale, pos.x, 2),
        y: calculateRangeBorder(outerHeight * scale, pos.y, 2)
      }
  }
}

const checkIfRangeForUpdate = (pos, scale, range) => {
  scale = Math.max(1 / scale, 1);
  return (
    !checkIfInRange(pos.x, range.start.x, range.start.x + outerWidth * scale * 4)
      || !checkIfInRange(pos.y, range.start.y, range.start.y + outerHeight * scale * 4)
  )
}

export { calculateRange, checkIfRangeForUpdate };
