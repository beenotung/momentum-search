import { create_momentum } from '../momentum'

let sample_size = 4

let dataset: { x: number[]; y: number }[] = [
  { x: [0, 0], y: 0 },
  { x: [1, 0], y: 1 },
  { x: [0, 1], y: 1 },
  { x: [1, 1], y: 0 },
]

let n = 0
{
  n += 2 + 1
  n += 2 + 1
  n += 2 + 1
}
let parameters = create_momentum({ n })
for (let i = 0; i < n; i++) {
  parameters.values[i] = Math.random() * 2 - 1
}

let index = 0
function forward(x: number[]): number {
  let acc = 0
  acc += x[0] * parameters.values[index++]
  acc += x[1] * parameters.values[index++]
  acc += parameters.values[index++]
  return sigmoid(acc)
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

function predict(x: number[]) {
  index = 0
  x = [forward(x), forward(x)]
  let y = forward(x)
  return y
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

debugger
parameters.auto_tune({
  loss_fn: benchmark,
  min_loss: 1 / 1000,
  min_step: 1 / 1000,
  initial_step: 1 / 100,
  iterate_callback: options => {
    let { epoch, tuned } = options
    let error = benchmark()
    console.log(
      `epoch=${epoch}, tuned=${f(tuned)}, error=${f(error)}, parameters=[${
        parameters.values
      }]`,
    )
  },
})

console.log(parameters)
