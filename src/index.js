const { Stepper } = require('./Stepper')
const { StopClock } = require('./StopClock')

module.exports = {
  Stepper,
  StopClock,
  Step: Stepper.Step,
  Dataset: Stepper.Dataset,

  default: Stepper
}
