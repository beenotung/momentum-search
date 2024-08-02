# momentum-search

A TypeScript library to iteratively tune parameters using adaptive momentum-based optimization to minimize a given loss function.

[![npm Package Version](https://img.shields.io/npm/v/momentum-search)](https://www.npmjs.com/package/momentum-search)
[![Minified Package Size](https://img.shields.io/bundlephobia/min/momentum-search)](https://bundlephobia.com/package/momentum-search)
[![Minified and Gzipped Package Size](https://img.shields.io/bundlephobia/minzip/momentum-search)](https://bundlephobia.com/package/momentum-search)

## Features

- Momentum-based optimizer with adaptive step size
- Fail-safe mechanism to ensure convergence
- Support user-defined loss function
- Customizable terminate condition
- Resumable state
- Typescript support
- Isomorphic package: works in Node.js and browsers
- Works with plain Javascript, Typescript is not mandatory

## Installation

### Install from package manager

```bash
npm install momentum-search
```

```typescript
// import from typescript
import { create_momentum } from 'momentum-search'

// import from javascript
let { create_momentum } = require('momentum-search')
```

You can also install `momentum-search` with [pnpm](https://pnpm.io/), [yarn](https://yarnpkg.com/), or [slnpm](https://github.com/beenotung/slnpm)

### Load from script in html

```html
<!-- bundled 2.2KB, gzipped 651B -->
<script src="https://cdn.jsdelivr.net/npm/momentum-search@1.0.0/dist/browser.js"></script>

<!-- minified 1.1KB, gzipped 658B -->
<script src="https://cdn.jsdelivr.net/npm/momentum-search@1.0.0/dist/browser.js"></script>

<script>
  // use global function create_momentum
  let parameters = create_momentum({ n: 4 })
</script>
```

## Usage

Below is an example of how to use the package to tune values to minimize a loss function.

```typescript
import { create_momentum } from 'momentum-search'

let parameters = create_momentum({ n: 4 })
let coefficients = parameters.values

function linear_regression(x: number[]) {
  return (
    coefficients[0] * x[0] +
    coefficients[1] * x[1] +
    coefficients[2] * x[2] +
    coefficients[3]
  )
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
```

## Typescript Signature

```typescript
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
}): {
  values: number[]
  momentums: number[]

  /**
   * @description a step function to tune the values based on momentums.
   * The momentums are auto adjusted up/down based on the sampled gradient.
   */
  tune: (loss_fn: (values: number[]) => number) => void

  get last_tune_stats(): {
    tuned: number
    loss: number
  }

  /**
   * @description auto call tune() in loop,
   * until the tuned amount is below min_step,
   * or the loss_fn() output is below min_loss
   * */
  auto_tune: (options: {
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
  }) => void
}
```

## License

This project is licensed with [BSD-2-Clause](./LICENSE)

This is free, libre, and open-source software. It comes down to four essential freedoms [[ref]](https://seirdy.one/2021/01/27/whatsapp-and-the-domestication-of-users.html#fnref:2):

- The freedom to run the program as you wish, for any purpose
- The freedom to study how the program works, and change it so it does your computing as you wish
- The freedom to redistribute copies so you can help others
- The freedom to distribute copies of your modified versions to others
