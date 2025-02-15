import { Layout } from '@/plugins/types/gridscore'

export interface Sequence {
  steps: Step[]
}

type NextStep = (current: Step, layout: Layout, scoreWidth: number) => Step | undefined
type ValidCheck = (step: Step, layout: Layout, scoreWidth: number) => boolean

export interface WalkCell {
  x: number
  y: number
}

export interface Step {
  direction: Direction
  tts?: string | undefined
  x: number
  y: number
  cells?: WalkCell[] | undefined
}

export interface Method {
  name: string
  type: GuidedWalkType
  initialDirection: Direction
  i18n: string
  image: string
  next: NextStep,
  valid: ValidCheck
}

export enum Direction {
  l = 'l',
  r = 'r',
  d = 'd',
  u = 'u'
}

export enum GuidedWalkType {
  snake = 'snake',
  zigzag = 'zigzag'
}

const getSequence = (startX: number, startY: number, startDirection: Direction, nextMethod: Method, layout: Layout, scoreWidth: number): Sequence => {
  const result: Sequence = {
    steps: []
  }

  // Initialize with starting position
  if (scoreWidth === 1) {
    // Score width of 1 is easy, it's just the starting position itself
    result.steps.push({
      x: startX,
      y: startY,
      direction: startDirection,
      cells: [{ x: startX, y: startY }]
    })
  } else {
    // For two, we need to check which direction we're going, then round up/down to get the actual coordinates
    // as the step's coordinates are 0.5 off in one direction to be "between" two actual cells.
    if (startDirection === Direction.u || startDirection === Direction.d) {
      // Round x
      const [left, right] = [Math.floor(startX), Math.ceil(startX)]
  
      result.steps.push({
        x: startX,
        y: startY,
        direction: startDirection,
        cells: startDirection === Direction.u ? [{ x: left, y: startY }, { x: right, y: startY }] : [{ x: right, y: startY }, { x: left, y: startY }]
      })
    } else {
      // Round y
      const [left, right] = [Math.floor(startY), Math.ceil(startY)]
      
      result.steps.push({
        x: startX,
        y: startY,
        direction: startDirection,
        cells: startDirection === Direction.r ? [{ x: startX, y: left }, { x: startX, y: right }] : [{ x: startX, y: right }, { x: startX, y: left }]
      })
    }
  }

  let x = startX
  let y = startY
  let direction = startDirection
  // Now we iterate for as long as there are valid positions left
  let canContinue = true
  while (canContinue) {
    // Get the next one
    const next = nextMethod.next({ x, y, direction }, layout, scoreWidth)

    if (next) {
      // If it exists, remember the coordinates and direction
      x = next.x
      y = next.y
      direction = next.direction
      // Then assemble the cells to show for this step
      const cells: WalkCell[] = []

      if (scoreWidth === 1) {
        // SW=1 is easy again, just the cell itself
        cells.push({ x, y })
      } else {
        // For SW=2 check the direction again, then round up/down
        if (direction === Direction.u || direction === Direction.d) {
          const [left, right] = [Math.floor(x), Math.ceil(x)]
          if (direction === Direction.u) {
            cells.push({ x: left, y })
            cells.push({ x: right, y })
          } else {
            cells.push({ x: right, y })
            cells.push({ x: left, y })
          }
        } else {
          const [left, right] = [Math.floor(y), Math.ceil(y)]
          if (direction === Direction.r) {
            cells.push({ x, y: left })
            cells.push({ x, y: right })
          } else {
            cells.push({ x, y: right })
            cells.push({ x, y: left })
          }
        }
      }

      // Add the new step with the cells
      result.steps.push({
        x: next.x,
        y: next.y,
        direction: next.direction,
        tts: next.tts,
        cells: cells
      })
    } else {
      // We've not got anywhere left to go, so stop here
      canContinue = false
    }
  }

  return result
}

const nextVerticalLeft: NextStep = (current: Step, layout: Layout, scoreWidth: number): Step | undefined => {
  const result: Step = { x: current.x, y: current.y, direction: current.direction }

  if (current.direction === Direction.u) {
    if (result.y > 0) {
      result.y--
    } else if (result.x - (scoreWidth / 2) > 0) {
      result.x -= scoreWidth
      result.direction = Direction.d
      result.tts = 'widgetGuideOrderUturnLeft'
    } else {
      return undefined
    }
  } else {
    if (result.y < layout.rows - 1) {
      result.y++
    } else if (result.x - (scoreWidth / 2) > 0) {
      result.x -= scoreWidth
      result.direction = Direction.u
      result.tts = 'widgetGuideOrderUturnRight'
    } else {
      return undefined
    }
  }

  return result
}

const nextVerticalRight: NextStep = (current: Step, layout: Layout, scoreWidth: number): Step | undefined => {
  const result: Step = { x: current.x, y: current.y, direction: current.direction }

  if (current.direction === Direction.u) {
    if (result.y > 0) {
      result.y--
    } else if (result.x + (scoreWidth / 2) < layout.columns - 1) {
      result.x += scoreWidth
      result.direction = Direction.d
      result.tts = 'widgetGuideOrderUturnRight'
    } else {
      return undefined
    }
  } else {
    if (result.y < layout.rows - 1) {
      result.y++
    } else if (result.x + (scoreWidth / 2) < layout.columns - 1) {
      result.x += scoreWidth
      result.direction = Direction.u
      result.tts = 'widgetGuideOrderUturnLeft'
    } else {
      return undefined
    }
  }

  return result
}

const nextHorizontalUp: NextStep = (current: Step, layout: Layout, scoreWidth: number): Step | undefined => {
  const result: Step = { x: current.x, y: current.y, direction: current.direction }

  if (current.direction === Direction.l) {
    if (result.x > 0) {
      result.x--
    } else if (result.y - (scoreWidth / 2) > 0) {
      result.y -= scoreWidth
      result.direction = Direction.r
      result.tts = 'widgetGuideOrderUturnRight'
    } else {
      return undefined
    }
  } else {
    if (result.x < layout.columns - 1) {
      result.x++
    } else if (result.y - (scoreWidth / 2) > 0) {
      result.y -= scoreWidth
      result.direction = Direction.l
      result.tts = 'widgetGuideOrderUturnLeft'
    } else {
      return undefined
    }
  }

  return result
}

const nextHorizontalDown: NextStep = (current: Step, layout: Layout, scoreWidth: number): Step | undefined => {
  const result: Step = { x: current.x, y: current.y, direction: current.direction }

  if (current.direction === Direction.l) {
    if (result.x > 0) {
      result.x--
    } else if (result.y + (scoreWidth / 2) < layout.rows - 1) {
      result.y += scoreWidth
      result.direction = Direction.r
      result.tts = 'widgetGuideOrderUturnLeft'
    } else {
      return undefined
    }
  } else {
    if (result.x < layout.columns - 1) {
      result.x++
    } else if (result.y + (scoreWidth / 2) < layout.rows - 1) {
      result.y += scoreWidth
      result.direction = Direction.l
      result.tts = 'widgetGuideOrderUturnRight'
    } else {
      return undefined
    }
  }

  return result
}

const nextUpRightBack: NextStep = (current: Step, layout: Layout, scoreWidth: number): Step | undefined => {
  const result: Step = { x: current.x, y: current.y, direction: current.direction }

  if (result.y > 0) {
    result.y--
  } else if (result.x + (scoreWidth / 2) < layout.columns - 1) {
    result.x += scoreWidth
    result.y = layout.rows - 1
    result.tts = 'widgetGuideOrderBackRight'
  } else {
    return undefined
  }

  return result
}

const nextUpLeftBack: NextStep = (current: Step, layout: Layout, scoreWidth: number): Step | undefined => {
  const result: Step = { x: current.x, y: current.y, direction: current.direction }

  if (result.y > 0) {
    result.y--
  } else if (result.x - (scoreWidth / 2) > 0) {
    result.x -= scoreWidth
    result.y = layout.rows - 1
    result.tts = 'widgetGuideOrderBackLeft'
  } else {
    return undefined
  }

  return result
}

const nextDownRightBack: NextStep = (current: Step, layout: Layout, scoreWidth: number): Step | undefined => {
  const result: Step = { x: current.x, y: current.y, direction: current.direction }

  if (result.y < layout.rows - 1) {
    result.y++
  } else if (result.x - (scoreWidth / 2) > 0) {
    result.x -= scoreWidth
    result.y = 0
    result.tts = 'widgetGuideOrderBackRight'
  } else {
    return undefined
  }

  return result
}

const nextDownLeftBack: NextStep = (current: Step, layout: Layout, scoreWidth: number): Step | undefined => {
  const result: Step = { x: current.x, y: current.y, direction: current.direction }

  if (result.y < layout.rows - 1) {
    result.y++
  } else if (result.x + (scoreWidth / 2) < layout.columns - 1) {
    result.x += scoreWidth
    result.y = 0
    result.tts = 'widgetGuideOrderBackLeft'
  } else {
    return undefined
  }

  return result
}

const nextLeftDownBack: NextStep = (current: Step, layout: Layout, scoreWidth: number): Step | undefined => {
  const result: Step = { x: current.x, y: current.y, direction: current.direction }

  if (result.x > 0) {
    result.x--
  } else if (result.y + (scoreWidth / 2) < layout.rows - 1) {
    result.y += scoreWidth
    result.x = layout.columns - 1
    result.tts = 'widgetGuideOrderBackLeft'
  } else {
    return undefined
  }

  return result
}

const nextRightDownBack: NextStep = (current: Step, layout: Layout, scoreWidth: number): Step | undefined => {
  const result: Step = { x: current.x, y: current.y, direction: current.direction }

  if (result.x < layout.columns - 1) {
    result.x++
  } else if (result.y + (scoreWidth / 2) < layout.rows - 1) {
    result.y += scoreWidth
    result.x = 0
    result.tts = 'widgetGuideOrderBackRight'
  } else {
    return undefined
  }

  return result
}

const nextLeftUpBack: NextStep = (current: Step, layout: Layout, scoreWidth: number): Step | undefined => {
  const result: Step = { x: current.x, y: current.y, direction: current.direction }

  if (result.x > 0) {
    result.x--
  } else if (result.y - (scoreWidth / 2) > 0) {
    result.y -= scoreWidth
    result.x = layout.columns - 1
    result.tts = 'widgetGuideOrderBackRight'
  } else {
    return undefined
  }

  return result
}

const nextRightUpBack: NextStep = (current: Step, layout: Layout, scoreWidth: number): Step | undefined => {
  const result: Step = { x: current.x, y: current.y, direction: current.direction }

  if (result.x < layout.columns - 1) {
    result.x++
  } else if (result.y - (scoreWidth / 2) > 0) {
    result.y -= scoreWidth
    result.x = 0
    result.tts = 'widgetGuideOrderBackLeft'
  } else {
    return undefined
  }

  return result
}

const methods: Method[] = [
  {
    name: 'up-left',
    type: GuidedWalkType.snake,
    initialDirection: Direction.u,
    i18n: 'widgetGuideOrderUpLeft',
    image: 'img/guided-walk/scoring-order-u-l.svg',
    next: nextVerticalLeft,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextVerticalLeft({ x: step.x, y: step.y, direction: Direction.u }, layout, scoreWidth) !== undefined
  },
  {
    name: 'up-right',
    type: GuidedWalkType.snake,
    initialDirection: Direction.u,
    i18n: 'widgetGuideOrderUpRight',
    image: 'img/guided-walk/scoring-order-u-r.svg',
    next: nextVerticalRight,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextVerticalRight({ x: step.x, y: step.y, direction: Direction.u }, layout, scoreWidth) !== undefined
  },
  {
    name: 'down-left',
    type: GuidedWalkType.snake,
    initialDirection: Direction.d,
    i18n: 'widgetGuideOrderDownLeft',
    image: 'img/guided-walk/scoring-order-d-l.svg',
    next: nextVerticalLeft,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextVerticalLeft({ x: step.x, y: step.y, direction: Direction.d }, layout, scoreWidth) !== undefined
  },
  {
    name: 'down-right',
    type: GuidedWalkType.snake,
    initialDirection: Direction.d,
    i18n: 'widgetGuideOrderDownRight',
    image: 'img/guided-walk/scoring-order-d-r.svg',
    next: nextVerticalRight,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextVerticalRight({ x: step.x, y: step.y, direction: Direction.d }, layout, scoreWidth) !== undefined
  },
  {
    name: 'left-up',
    type: GuidedWalkType.snake,
    initialDirection: Direction.l,
    i18n: 'widgetGuideOrderLeftUp',
    image: 'img/guided-walk/scoring-order-l-u.svg',
    next: nextHorizontalUp,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextHorizontalUp({ x: step.x, y: step.y, direction: Direction.l }, layout, scoreWidth) !== undefined
  },
  {
    name: 'right-up',
    type: GuidedWalkType.snake,
    initialDirection: Direction.r,
    i18n: 'widgetGuideOrderRightUp',
    image: 'img/guided-walk/scoring-order-r-u.svg',
    next: nextHorizontalUp,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextHorizontalUp({ x: step.x, y: step.y, direction: Direction.r }, layout, scoreWidth) !== undefined
  },
  {
    name: 'right-down',
    type: GuidedWalkType.snake,
    initialDirection: Direction.r,
    i18n: 'widgetGuideOrderRightDown',
    image: 'img/guided-walk/scoring-order-r-d.svg',
    next: nextHorizontalDown,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextHorizontalDown({ x: step.x, y: step.y, direction: Direction.r }, layout, scoreWidth) !== undefined
  },
  {
    name: 'left-down',
    type: GuidedWalkType.snake,
    initialDirection: Direction.l,
    i18n: 'widgetGuideOrderLeftDown',
    image: 'img/guided-walk/scoring-order-l-d.svg',
    next: nextHorizontalDown,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextHorizontalDown({ x: step.x, y: step.y, direction: Direction.l }, layout, scoreWidth) !== undefined
  },
  {
    name: 'up-left-back',
    type: GuidedWalkType.zigzag,
    initialDirection: Direction.u,
    i18n: 'widgetGuideOrderUpLeftBack',
    image: 'img/guided-walk/scoring-order-u-l-b.svg',
    next: nextUpLeftBack,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextUpLeftBack({ x: step.x, y: step.y, direction: Direction.u }, layout, scoreWidth) !== undefined
  },
  {
    name: 'up-right-back',
    type: GuidedWalkType.zigzag,
    initialDirection: Direction.u,
    i18n: 'widgetGuideOrderUpRightBack',
    image: 'img/guided-walk/scoring-order-u-r-b.svg',
    next: nextUpRightBack,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextUpRightBack({ x: step.x, y: step.y, direction: Direction.u }, layout, scoreWidth) !== undefined
  },
  {
    name: 'down-right-back',
    type: GuidedWalkType.zigzag,
    initialDirection: Direction.d,
    i18n: 'widgetGuideOrderDownRightBack',
    image: 'img/guided-walk/scoring-order-d-r-b.svg',
    next: nextDownRightBack,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextDownRightBack({ x: step.x, y: step.y, direction: Direction.d }, layout, scoreWidth) !== undefined
  },
  {
    name: 'down-left-back',
    type: GuidedWalkType.zigzag,
    initialDirection: Direction.d,
    i18n: 'widgetGuideOrderDownLeftBack',
    image: 'img/guided-walk/scoring-order-d-l-b.svg',
    next: nextDownLeftBack,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextDownLeftBack({ x: step.x, y: step.y, direction: Direction.d }, layout, scoreWidth) !== undefined
  },
  {
    name: 'left-up-back',
    type: GuidedWalkType.zigzag,
    initialDirection: Direction.l,
    i18n: 'widgetGuideOrderLeftUpBack',
    image: 'img/guided-walk/scoring-order-l-u-b.svg',
    next: nextLeftUpBack,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextLeftUpBack({ x: step.x, y: step.y, direction: Direction.l }, layout, scoreWidth) !== undefined
  },
  {
    name: 'right-up-back',
    type: GuidedWalkType.zigzag,
    initialDirection: Direction.r,
    i18n: 'widgetGuideOrderRightUpBack',
    image: 'img/guided-walk/scoring-order-r-u-b.svg',
    next: nextRightUpBack,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextRightUpBack({ x: step.x, y: step.y, direction: Direction.r }, layout, scoreWidth) !== undefined
  },
  {
    name: 'right-down-back',
    type: GuidedWalkType.zigzag,
    initialDirection: Direction.r,
    i18n: 'widgetGuideOrderRightDownBack',
    image: 'img/guided-walk/scoring-order-r-d-b.svg',
    next: nextRightDownBack,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextRightDownBack({ x: step.x, y: step.y, direction: Direction.r }, layout, scoreWidth) !== undefined
  },
  {
    name: 'left-down-back',
    type: GuidedWalkType.zigzag,
    initialDirection: Direction.l,
    i18n: 'widgetGuideOrderLeftDownBack',
    image: 'img/guided-walk/scoring-order-l-d-b.svg',
    next: nextLeftDownBack,
    valid: (step: Step, layout: Layout, scoreWidth: number) => nextLeftDownBack({ x: step.x, y: step.y, direction: Direction.l }, layout, scoreWidth) !== undefined
  }
]

export {
  methods,
  getSequence
}
