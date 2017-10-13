# stepwise

## Overview
Stepwise is a small task runner that takes a bunch of user defined objects, in
which there is user defined step() function that performs work. The steps are
executed in order and there are mechanisms to programmatically decide to skip
over a given test

### Why I wrote this
There are several steps that nearly every Express app or command line code
ends up repeating. Some times I find myself commenting out a section of it
for testing or other reasons. Sometimes I only want the HTTP server and not
the HTTPS stuff because I don't have a dev SSL cert. Etc etc etc.

This small module provides a decent way to do this as well as a method to
provide timing as it goes.

### Features
- [x] Start and stop timing for each step as it executes
- [x] A stop clock that allows tagging each stop for later debugging
- [x] Emits events as each step starts, completes and/or fails
- [x] Provides timings for each step as well as overall as a whole.

### Roadmap, Wishlists, Future
- [ ] Async/Await Support for steps
- [ ] Dynamically detect whether or not `proceed()` is a getter, function or property and support all three.
- [ ] Consider supporting subtasks/steps
- [ ] Add EventEmitter tests

### Installation
Head over to your project, install it and start using

```sh
npm install --save stepwise
```

### Usage
You'll need to create a `Stepper` as well as some `Step`s to make things go.

```javascript
const { Stepper, Stepper: { Step } } = require('stepwise')
let express = require('express')

let Stepper = Stepper.from([express()],
  Step('Step One', (app) => {...}),
  Step('Step Two', (app) => {...}),
  Step('Step Three', (app) => {...})
)

let results = Stepper.startSteppin()
```
