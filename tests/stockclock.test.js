import { StopClock } from '../src/StopClock'

describe('Test the StockClock', () => {
  let clock = StopClock()
  let label = 'Sample Label'

  it('should allow being reset', () => {
    let timeBefore = clock.time
    let timeAfter

    clock.reset()
    timeAfter = clock.time

    expect(timeBefore).not.toBe(timeAfter)
  })

  it('should track stop labels', () => {
    clock.reset();
    clock.stop(label)

    let stop = clock.findStop(label)

    expect(stop.label).toBe(label)
    expect(stop.start).toBe(clock.start)
    expect(+stop).toBe(+clock.stops[stop.index])
    expect(stop.index).toBe(0)

    clock.stop(String(NaN))
    expect(clock.findStop(String(NaN)).index).toBe(1)
  })

  it('should have a [[class]] of StopClock', () => {
    let value = `[object ${StopClock.name}]`
    let type = Object.prototype.toString;

    expect(value).toEqual(type.call(StopClock))
    expect(value).toBe(type.call(clock))
  })
})
