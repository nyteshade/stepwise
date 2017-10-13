import { Stepper } from '../src/Stepper'

const { Step } = Stepper;

describe('Stepper class tests', () => {
  let given = { age: 24, canRentACar: true }
  let stepper = Stepper.from(given,
    Step('Step One', (given) => {
      console.log(`
        When you are ${given.age} I hear that it is ${given.canRentACar}
        that you can rent a car.
      `)
    }),

    Step('Step Two', (given) => {
      given.hasNoMoney = true
      given.canRentACar = false
    }),

    Step('Step Three', (given) => {
      console.log(`
        I hear that it is ${given.hasNoMoney} that you have no money,
        which means ${given.canRentACar
          ? 'you can rent a car'
          : 'you cannot rent a car'
        }
      `)
    })
  )

  it('can inform others whether or not it has stepped through yet', () => {
    let simpleStepper = new Stepper();

    expect(simpleStepper.hasStepped).toBe(false);
  })

  it('can step through all of its steps', () => {
    let results = stepper.startSteppin()

    expect(results.stepped).toBe(true)
    expect(results.hasErrors).toBe(false)
    expect(results.data.length).toBe(stepper.steps.length)
  })

  it('allows adding a step later', () => {
    stepper.steps.push(Step('Step four', (given) => {
      throw new Error('NO NO NO!')
    }))

    let results = stepper.startSteppin()

    expect(results.hasErrors).toBe(true)
    expect(results.errors[0].message).toBe('NO NO NO!')
  })

  it('runs post-reset after adding a new step', () => {
    stepper.steps.push(Step('Step four', (given) => {
      throw new Error('YES YES YES!')
    }))

    stepper.reset();
    let results = stepper.startSteppin()

    expect(results.hasErrors).toBe(true)
    expect(results.errors.length).toBe(2)
  })

})
