let default_initial_step = 1048576

export function create_momentum(options: {
  /**
   * @description number of parameters to be optimized
   */
  n: number

  /**
   * @description set the initial momentum to be this value
   * @default 1048576
   */
  initial_step?: number
}) {
  let n = options.n

  let values: number[] = new Array(n).fill(0)
  let momentums: number[] = new Array(n).fill(
    options.initial_step || default_initial_step,
  )

  /* internal variables of tune() */
  let tuned = 0
  let base_loss = NaN

  /**
   * @description a step function to tune the values based on momentums.
   * The momentums are auto adjusted up/down based on the sampled gradient.
   */
  function tune(loss_fn: (values: number[]) => number): void {
    base_loss = loss_fn(values)
    tuned = 0
    for (let i = 0; i < n; i++) {
      let base_value = values[i]

      for (;;) {
        let momentum = momentums[i]
        if (momentum == 0) {
          values[i] = base_value
          break
        }

        values[i] = base_value + momentum
        let forward_loss = loss_fn(values)

        if (forward_loss < base_loss) {
          /* forward is better */
          base_loss = forward_loss
          tuned += Math.abs(momentum)
          momentums[i] *= 1.5
          break
        }

        values[i] = base_value - momentum
        let backward_loss = loss_fn(values)
        if (backward_loss < base_loss) {
          /* backward is better */
          base_loss = backward_loss
          tuned += Math.abs(momentum)
          momentums[i] *= -1
          break
        }

        /* both are not good */
        momentums[i] /= 2
        continue
      }
    }
  }

  /**
   * @description auto call tune() in loop,
   * until the tuned amount is below min_step,
   * or the loss_fn() output is below min_loss
   * */
  function auto_tune(options: {
    /**
     * @description loss function to be minimized.
     * */
    loss_fn: (values: number[]) => number

    /**
     * @description set the initial momentum to be this value
     * @default undefined to skip initialization
     */
    initial_step?: number

    /**
     * @description stopping condition when the tuned amount is below this value
     * @default 0
     */
    min_step?: number

    /**
     * @description stopping condition when the loss is below this value
     * @default 0
     */
    min_loss?: number

    /**
     * @description optional post-epoch callback for progress report
     */
    iterate_callback?: (options: {
      epoch: number
      tuned: number
      loss: number
      values: number[]
      momentums: number[]
    }) => void
  }) {
    let min_step = options.min_step || 0
    let min_loss = options.min_loss || 0
    let { loss_fn, iterate_callback } = options

    if (options.initial_step) {
      momentums.fill(options.initial_step)
    }

    if (iterate_callback) {
      let epoch = 0
      for (;;) {
        epoch++
        tune(loss_fn)
        iterate_callback({ epoch, tuned, loss: base_loss, values, momentums })
        if (tuned <= min_step || base_loss <= min_loss) {
          break
        }
      }
    } else {
      for (;;) {
        tune(loss_fn)
        if (tuned <= min_step || base_loss <= min_loss) {
          break
        }
      }
    }
  }

  return {
    values,
    momentums,
    tune,
    get last_tune_stats() {
      return { tuned, loss: base_loss }
    },
    auto_tune,
  }
}
