/**
 * StopClock catches the current timestamp when created and allows you to
 * easily take multiple timings as well as reset the data in you StopClock
 * instance.
 *
 * @method StopClock
 * @constructor
 */
function StopClock() {
  return {
    /**
     * Resets the start time as well as any previously stored stop timings
     *
     * @method StopClock#reset
     */
    reset() {
      this.start = Date.now();
      this.stops.splice(0, this.stops.length)
    },

    /**
     * A number property representing when the object was created or when
     * the last time `reset()` was called.
     *
     * @type {number}
     * @instance
     */
    start: Date.now(),

    /**
     * An array of timings, in milliseconds, denoting the last time a call
     * to stop was made relative to when the `StopClock` was started
     *
     * @type {Array<number>}
     * @instance
     */
    stops: [],

    /**
     * Finds a stop that has a matching label. If there is a stop with a
     * given label, that stop will be returned. The stop will have some
     * additional meta associated with it.
     *
     * ```
     * Object(stopTime) => {
     *   stop: number,
     *   start: number,
     *   index: number,
     *   label: string
     * }
     * ```
     *
     * @param {string} label
     * @returns
     */
    findStop(label) {
      return this.stops.reduce((p, c, i) => {
        if (p) {
          return p;
        }

        if (c && c.label && c.label == label) {
          return Object.assign(Object(+c), {
            stop: +c,
            start: this.start,
            label: c.label,
            index: i
          })
        }

        return null;
      }, null)
    },

    /**
     * A function that both adds a new calculated stop timing to the list of
     * recorded `stops` as well as returns a the number recorded. Again the
     * value returned is the number of milliseconds since the start time.
     *
     * @method StopClock#stop
     *
     * @param {string} label by wrapping our stop time in an `Object()` call,
     * we are able to add a string associated with the timing but still use
     * it as a number; ain't JavaScript grand?
     * @return {number} the number of milliseconds that have passed since the
     * start time was recorded or the last recorded stop time if relative is
     * true and there is one to compare to.
     */
    stop(label) {
      const now = Object(Date.now());
      const last = this.stops.length
        ? this.stops[this.stops.length - 1]
        : this.start
      const time = now - last;

      // Annotate our stop time with a label
      now.label = label || null;

      this.stops.push(now);
      return time;
    },

    /**
     * Provides an object detailing the various stops, the start time and the
     * total time elapsed. The resulting object, if coerced into a string
     * returns an object that shows the total elapsed time followed by 'ms'
     * and if coerced into a number does the same without.
     *
     * @return {Object} a summary object
     */
    get summary() {
      let self = this;
      let summary = {
        start: this.start,
        stops: this.stops.map((stop, index, array) => {
          return {
            time: +stop,
            delta: index == 0 ? 0 : stop - array[index - 1],
            total: stop - this.start,
            label: stop.label
          }
        }),
        stop: this.stops[this.stops.length - 1] || Infinity,
        total: this.time,
        sinceStart: this.timeSinceStart,
        get [Symbol.toStringTag]() { return "StopClockSummary" },
        [Symbol.toPrimitive](hint) {
          return hint == 'number' ? self.time : self.toString()
        }
      }

      return summary;
    },

    /**
     * When evaluated as a getter, the current time elapsed in milliseconds
     * since the clock was started if the clock has never stopped. Otherwise
     * it returns the time from start until the last stop.
     *
     * @method StopClock#time
     *
     * @return {number} the elapsed time since start in milliseconds
     */
    get time() {
      let stop = this.stops.length
        ? this.stops[this.stops.length - 1]
        : Date.now()

      return stop - this.start;
    },

    /**
     * When evaluated as a getter, the current time elapsed in milliseconds
     * since the clock was last stopped is returned as a number.
     *
     * @return {number} the elapsed time since the last stop in milliseconds
     */
    get timeSinceLastStop() {
      if (this.stops.length) {
        return this.time;
      }

      return Date.now() - this.stops[this.stops.length - 1];
    },

    /**
     * When evaluated as a getter, the current time elapsed in milliseconds
     * since the clock was started is returned as a number.
     *
     * @method StopClock#timeSinceStart
     *
     * @return {number} the elapsed time since start in milliseconds
     */
    get timeSinceStart() {
      return Date.now() - this.start
    },

    /**
     * When evaluated as a string, the current time elapsed in milliseconds
     * since the clock was started is returned as a string. The string is also
     * labeled with a trailing 'ms'. So 3000 would be '3000ms'.
     *
     * @method StopClock#toString
     *
     * @return {string} the elapsed time since start in milliseconds as a
     * string postfixed with 'ms'
     */
    toString() {
      return `${this.time}ms`;
    },

    /**
     * The `Symbol.toStringTag` symbol denotes the type of the object or
     * object instance in question. For StopClock instances, that is the
     * string "StopClock".
     *
     * Passing an instance of `StopClock` through Object.prototype.toString
     * will reveal the string `"[object StopClock]"`
     *
     * @return {string} the value `"StopClock"`
     */
    [Symbol.toStringTag]: StopClock.name
  }
}

StopClock[Symbol.toStringTag] = StopClock.name;

module.exports = {
  StopClock,

  default: StopClock
}
