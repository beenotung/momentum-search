import { create_momentum } from '../momentum'

let sample_size = 1000
let dataset: { x: number[]; y: number }[] = []

function loadDataset() {
  let c0 = Math.PI
  let c1 = Math.E
  let c2 = Math.sqrt(2)
  let c3 = 12.5

  for (let i = 0; i < sample_size; i++) {
    let x1 = Math.random() * 2 - 1
    let x2 = Math.random() * 2 - 1
    let x3 = Math.random() * 2 - 1
    let y = c0 + c1 * x1 + c2 * x2 + c3 * x3
    dataset.push({ x: [x1, x2, x3], y })
  }
}

loadDataset()

let parameters = create_momentum({ n: 4 })
let coefficients = parameters.values

function predict(x: number[]) {
  return (
    coefficients[0] * x[0] +
    coefficients[1] * x[1] +
    coefficients[2] * x[2] +
    coefficients[3]
  )
}

function benchmark() {
  let mse = 0
  for (let data of dataset) {
    let error = predict(data.x) - data.y
    mse += error * error
  }
  mse /= dataset.length
  let error = Math.sqrt(mse)
  return error
}

function f(x: number): string {
  return x.toPrecision(3)
}

parameters.auto_tune({
  loss_fn: benchmark,
  min_loss: 1 / 1000,
  min_step: 1 / 1000,
  iterate_callback: options => {
    let { epoch, tuned } = options
    let error = benchmark()
    console.log(
      `epoch=${epoch}, tuned=${f(tuned)}, error=${f(error)}, coefficients=${
        parameters.values
      }`,
    )
  },
})

console.log(parameters.values)
