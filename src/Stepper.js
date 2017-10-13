const { StopClock } = require('./StopClock')
const EventEmitter = require('events')

const OARGS = Symbol.for('Stepper.originalStepArgs')
const BARGS = Symbol.for('Stepper.boundArgs')
const STEPS = Symbol.for('Stepper.steps')
const SDATA = Symbol.for('Stepper.finishedSteps')
const TTIME = Symbol.for('Stepper.totalTime')

/**
 * The Stepper class is a convenience tool that allows an implementor to
 * supply several JavaScript objects, each of which must contain a `step()`
 * method, that will be processed in order each time `startSteppin()` is
 * called.
 *
 * The objects provide additional context to the step() function executed
 * in each pass. The class times the execution time of each function, providing
 * a metrics object at the end detailing the timings of the entire process
 * as well as each step along the way.
 *
 * Easy usage might look like this:
 * ```
 * const { Stepper, Stepper: { Step } } = require('stepwise')
 * const app = express()
 *
 * let stepper = new Stepper([app],
 *   Step(
 *     'Calculate the ports',
 *     (server) => { // Same as app
 *       // do work to calculate ports
 *     }
 *   ),
 *   Step(
 *     'Start the HTTP Server',
 *     (server) => { // Same as app
 *       // start the server
 *     }
 *   )
 * )
 *
 * stepper.startSteppin()
 *
 * ```
 *
 * @class Stepper
 */
class Stepper extends EventEmitter {
  constructor(stepArgs, ...steps) {
    super();

    // If we are passed null or undefined, turn that into an empty array
    // but if we have a different value, keep it
    let args = (stepArgs === null || stepArgs === undefined) ? [] : stepArgs;

    // If the arguments we are left with are not actually an array, wrap
    // the value in an array so it can be successfully passed to each
    // subsequent step() function call.
    if (!Array.isArray(args)) {
      args = [args];
    }

    this[OARGS] = args;
    this[BARGS] = [].concat(args)
    this[SDATA] = []
    this[STEPS] = [].concat(steps)
    this[TTIME] = StopClock();

    this.hasStepped = false
  }

  /**
   * Drops all existing step data, resets all the clocks and flags and
   * resets the Stepper back to its initial state.
   *
   * @memberof Stepper
   * @method reset
   */
  reset() {
    this.hasStepped = false;
    this[BARGS] = [].concat(this[OARGS])
    this[SDATA] = []
  }

  /**
   * An alternate, if less amusing, way of starting the stepper.
   *
   * @param {mixed} altContext an alternate `this` for each step as it is
   * executed.
   * @memberof Stepper
   */
  start(altContext) {
    // Less amusing way to start the stepper
    return this.startSteppin(altContext)
  }

  /**
   * Starts the stepper. Each step in the list will be executed in order.
   * Timing will be captured around the step execution using `StopClock`.
   *
   * @param {mixed} altContext an alternate `this` for each step as it is
   * executed.
   * @memberof Stepper
   * @returns {Object} the result of the getter `results` which summarizes
   * the execution path
   */
  startSteppin(altContext) {
    this[TTIME].reset();

    for (let step of this[STEPS]) {
      let stepData = Stepper.Dataset(step)
      let boundedStep = step.step.bind(altContext || step, ...this[BARGS])
      let doIt = false;

      try {
        this.emit(Stepper.STEP_STARTED, null, step, stepData)
        stepData.stopclock.reset()
        doIt = step.proceed.apply(altContext || step, this[BARGS])
        stepData.stopclock.stop()
        if (doIt) {
          boundedStep()
        }
        stepData.stopclock.stop()
        this.emit(Stepper.STEP_COMPLETED, null, step, stepData)
        this[SDATA].push(stepData)
      }
      catch (error) {
        stepData.stopclock.stop()
        stepData.error = error
        this.emit(Stepper.STEP_FAILED, error, step, stepData);
        this[SDATA].push(stepData)
      }

      this[TTIME].stop()
    }

    this[TTIME].stop()

    this.hasStepped = true

    return this.results;
  }

  /**
   * Looks over the results and returns a summary of timings, execution and
   * errors, if any, that may have occurred.
   *
   * @readonly
   * @memberof Stepper
   */
  get results() {
    return {
      stepped: this.hasStepped,
      timing: this[TTIME].summary,
      totalTime: this[TTIME].time,
      hasErrors: this[SDATA].reduce((p,c,i,a) => {
        if (p) { return true }
        if (c.error) { return true }
        return false;
      }, false),
      errors: this[SDATA]
        .map(i => i.error)
        .reduce((p,c) => c ? p.concat([c]) : p, []),
      data: this[SDATA]
    }
  }

  /**
   * A getter retrieving the list of steps registered with the stepper. Items
   * can be removed with `.splice` and added with `.push` but the list cannot
   * be directly replaced.
   *
   * @readonly
   * @memberof Stepper
   */
  get steps() {
    return this[STEPS]
  }

  /**
   * A constant used to set event listeners for when a step begins execution
   *
   * When the event is triggered, the callback to be registered should follow
   * this format
   *
   * `(error, step, stepData) => {...}`
   *
   * Error typically null for this event
   * Step is the registered step object and associated function
   * StepData is meta data captured around the execution of a given step
   *
   * @readonly
   * @static
   * @memberof Stepper
   */
  static get STEP_STARTED() { return 'Step started' }

  /**
   * A constant used to set event listeners for when a step has completed
   * execution
   *
   * When the event is triggered, the callback to be registered should follow
   * this format
   *
   * `(error, step, stepData) => {...}`
   *
   * Error typically null for this event
   * Step is the registered step object and associated function
   * StepData is meta data captured around the execution of a given step
   *
   * @readonly
   * @static
   * @memberof Stepper
   */
  static get STEP_COMPLETED() { return 'Step completed'}

  /**
   * A constant used to set event listeners for when a step has failed to
   * successfully execute
   *
   * When the event is triggered, the callback to be registered should follow
   * this format
   *
   * `(error, step, stepData) => {...}`
   *
   * Error is the error, if any, that occurred during execution
   * Step is the registered step object and associated function
   * StepData is meta data captured around the execution of a given step
   *
   * @readonly
   * @static
   * @memberof Stepper
   */
  static get STEP_FAILED() { return 'Step Failed' }

  /**
   * Shortcut function to instantiate a new Stepper for those who like
   * such things.
   *
   * @static
   * @param {Array<mixed>} args
   * @returns
   * @memberof Stepper
   */
  static from(...args) {
    return new this(...args);
  }

  /**
   * `Dataset()` returns an object that is used to track information about
   * a particular Stepper run. Errors and other information will be tracked
   * in a Dataset object for each pass.
   *
   * @static
   * @param {any} step
   * @param {any} boundArgs
   * @returns
   * @memberof Stepper
   */
  static Dataset(step, boundArgs) {
    if (new.target) {
      console.warn('Stepper.Dataset is a function; call it like one');
    }

    return {
      stopclock: StopClock(),
      error: null,
      step: step,
      boundArgs: boundArgs,
      get [Symbol.toStringTag]() { return 'Stepper.Dataset' }
    }
  }

  /**
   * Each `Step()` call returns and object with a name as specified in the
   * first parameter and supplied `step(...)` function. This function will
   * be called when its turn in the line is reached.
   *
   * First the `.proceed` function is called and receives the step itself
   * along with arguments a `.step()` function would receive. If proceed
   * returns anything truthy, the step function will be executed thereafter.
   *
   * @static
   * @param {any} name
   * @param {any} stepFunction
   * @param {any} stepData
   * @returns
   * @memberof Stepper
   */
  static Step(name, stepFunction, ...stepData) {
    if (new.target) {
      console.warn('Stepper.Step is a function; call it like one');
    }

    let step = {
      name,
      proceed: (stepArgs) => { return true },
      step: stepFunction || function noOpStep() {},
      get [Symbol.toStringTag]() { return 'Stepper.Step' }
    };

    for (let i of stepData) {
      Object.assign(step, i)
    }

    return step;
  }
}

module.exports = {
  Stepper,

  default: Stepper
}
