let default_initial_step = 1048576

function default_reset_values(values: number[]): void {
  let n = values.length
  for (let i = 0; i < n; i++) {
    values[i] = Math.random() * 2 - 1
  }
}

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
  let base_loss = NaN
  let tuned = 0
  let tuned_flags: boolean[] = new Array(n).fill(false)

  /**
   * @description a step function to tune the values based on momentums.
   * The momentums are auto adjusted up/down based on the sampled gradient.
   */
  function tune(loss_fn: (values: number[]) => number): void {
    base_loss = loss_fn(values)
    tuned = 0
    tuned_flags.fill(false)
    let need_more_loop = true
    for (; need_more_loop; ) {
      need_more_loop = false
      for (let i = 0; i < n; i++) {
        if (tuned_flags[i]) {
          continue
        }

        let momentum = momentums[i]
        if (momentum == 0) {
          continue
        }

        let base_value = values[i]

        values[i] = base_value + momentum
        let forward_loss = loss_fn(values)

        if (forward_loss < base_loss) {
          /* forward is better */
          base_loss = forward_loss
          tuned += Math.abs(momentum)
          tuned_flags[i] = true
          momentums[i] *= 1.5
          continue
        }

        values[i] = base_value - momentum
        let backward_loss = loss_fn(values)
        if (backward_loss < base_loss) {
          /* backward is better */
          base_loss = backward_loss
          tuned += Math.abs(momentum)
          tuned_flags[i] = true
          momentums[i] *= -1
          continue
        }

        /* both are not good, reduce step size */
        values[i] = base_value
        let new_momentum = momentum / 2
        if (new_momentum == momentum) {
          /* converged */
          tuned_flags[i] = true
          momentums[i] = 0
          continue
        }
        momentums[i] = new_momentum
        need_more_loop = true
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

    /**
     * @description to reset the values when got stuck in local optimal
     * @default Random between -1 and +1
     */
    reset_values?: (values: number[]) => void
  }) {
    let min_step = options.min_step || 0
    let min_loss = options.min_loss || 0
    let initial_step = options.initial_step || default_initial_step
    let reset_values = options.reset_values || default_reset_values
    let { loss_fn, iterate_callback } = options

    momentums.fill(initial_step)

    if (iterate_callback) {
      let epoch = 0
      for (;;) {
        epoch++
        tune(loss_fn)
        iterate_callback({ epoch, tuned, loss: base_loss, values, momentums })
        if (base_loss <= min_loss) {
          break
        }
        if (tuned <= min_step) {
          reset_values(values)
          momentums.fill(initial_step)
        }
      }
    } else {
      for (;;) {
        tune(loss_fn)
        if (base_loss <= min_loss) {
          break
        }
        if (tuned <= min_step) {
          reset_values(values)
          momentums.fill(initial_step)
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
