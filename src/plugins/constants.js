const gridScoreVersion = '3.1.1'

const NAVIGATION_MODE_DRAG = 'DRAG'
const NAVIGATION_MODE_JUMP = 'JUMP'

const DISPLAY_ORDER_TOP_TO_BOTTOM = 'TOP_TO_BOTTOM'
const DISPLAY_ORDER_BOTTOM_TO_TOP = 'BOTTOM_TO_TOP'
const DISPLAY_ORDER_LEFT_TO_RIGHT = 'LEFT_TO_RIGHT'
const DISPLAY_ORDER_RIGHT_TO_LEFT = 'RIGHT_TO_LEFT'

const TRAIT_TIMEFRAME_TYPE_SUGGEST = 'SUGGEST'
const TRAIT_TIMEFRAME_TYPE_ENFORCE = 'ENFORCE'

const TRIAL_STATE_NOT_SHARED = 'NOT_SHARED'
const TRIAL_STATE_OWNER = 'OWNER'
const TRIAL_STATE_EDITOR = 'EDITOR'
const TRIAL_STATE_VIEWER = 'VIEWER'

const CANVAS_DENSITY_HIGH = 'high'
const CANVAS_DENSITY_MEDIUM = 'medium'
const CANVAS_DENSITY_LOW = 'low'

const CANVAS_SIZE_SMALL = 'small'
const CANVAS_SIZE_MEDIUM = 'medium'
const CANVAS_SIZE_LARGE = 'large'

const CANVAS_SHAPE_CIRCLE = 'circle'
const CANVAS_SHAPE_SQUARE = 'square'

const PLOT_DISPLAY_FIELD_DISPLAY_NAME = 'displayName'
const PLOT_DISPLAY_FIELD_GERMPLASM = 'germplasm'
const PLOT_DISPLAY_FIELD_REP = 'rep'
const PLOT_DISPLAY_FIELD_NOTHING = null

const TRIAL_LIST_TABBED = 'tabbed'
const TRIAL_LIST_ALL = 'all'
const TRIAL_LIST_GRID = 'grid'
const TRIAL_LIST_LIST = 'list'

const TRIAL_EVENT_TYPE_MANAGEMENT = 'MANAGEMENT'
const TRIAL_EVENT_TYPE_WEATHER = 'WEATHER'
const TRIAL_EVENT_TYPE_OTHER = 'OTHER'

const PERSON_TYPE_DATA_COLLECTOR = 'DATA_COLLECTOR'
const PERSON_TYPE_DATA_SUBMITTER = 'DATA_SUBMITTER'
const PERSON_TYPE_CORRESPONDING_AUTHOR = 'CORRESPONDING_AUTHOR'
const PERSON_TYPE_QUALITY_CHECKER = 'QUALITY_CHECKER'

const MAIN_DISPLAY_MODE_AUTO = 'auto'
const MAIN_DISPLAY_MODE_CANVAS_ONLY = 'canvas-only'

const CELL_CATEGORY_CONTROL = 'control'

const CELL_CATEGORIES = {}

CELL_CATEGORIES[CELL_CATEGORY_CONTROL] = { title: 'cellCategoryControl', variant: 'info' }

export {
  gridScoreVersion,
  NAVIGATION_MODE_DRAG,
  NAVIGATION_MODE_JUMP,
  DISPLAY_ORDER_TOP_TO_BOTTOM,
  DISPLAY_ORDER_BOTTOM_TO_TOP,
  DISPLAY_ORDER_LEFT_TO_RIGHT,
  DISPLAY_ORDER_RIGHT_TO_LEFT,
  TRAIT_TIMEFRAME_TYPE_SUGGEST,
  TRAIT_TIMEFRAME_TYPE_ENFORCE,
  TRIAL_STATE_NOT_SHARED,
  TRIAL_STATE_OWNER,
  TRIAL_STATE_EDITOR,
  TRIAL_STATE_VIEWER,
  CANVAS_DENSITY_HIGH,
  CANVAS_DENSITY_MEDIUM,
  CANVAS_DENSITY_LOW,
  CANVAS_SHAPE_CIRCLE,
  CANVAS_SHAPE_SQUARE,
  CANVAS_SIZE_SMALL,
  CANVAS_SIZE_MEDIUM,
  CANVAS_SIZE_LARGE,
  TRIAL_LIST_TABBED,
  TRIAL_LIST_ALL,
  TRIAL_LIST_GRID,
  TRIAL_LIST_LIST,
  TRIAL_EVENT_TYPE_MANAGEMENT,
  TRIAL_EVENT_TYPE_WEATHER,
  TRIAL_EVENT_TYPE_OTHER,
  CELL_CATEGORY_CONTROL,
  CELL_CATEGORIES,
  PERSON_TYPE_DATA_COLLECTOR,
  PERSON_TYPE_DATA_SUBMITTER,
  PERSON_TYPE_CORRESPONDING_AUTHOR,
  PERSON_TYPE_QUALITY_CHECKER,
  MAIN_DISPLAY_MODE_AUTO,
  MAIN_DISPLAY_MODE_CANVAS_ONLY,
  PLOT_DISPLAY_FIELD_DISPLAY_NAME,
  PLOT_DISPLAY_FIELD_GERMPLASM,
  PLOT_DISPLAY_FIELD_REP,
  PLOT_DISPLAY_FIELD_NOTHING
}
