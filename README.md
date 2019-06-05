<p align="center">
  <img width="460" height="150" src="https://svgshare.com/i/Cte.svg">
  </a>
</p>


[![Version](https://img.shields.io/npm/v/@openprofiling/core.svg)](https://img.shields.io/npm/v/@openprofiling/core.svg)
[![Build Status](https://cloud.drone.io/api/badges/vmarchaud/openprofiling-node/status.svg)](https://cloud.drone.io/vmarchaud/openprofiling-node)
[![codecov](https://codecov.io/gh/vmarchaud/openprofiling-node/branch/master/graph/badge.svg)](https://codecov.io/gh/vmarchaud/openprofiling-node)
[![License](https://img.shields.io/npm/l/@opencensus/core.svg)](https://img.shields.io/npm/l/@opencensus/core.svg)


OpenProfiling is a toolkit for collecting profiling data from production workload safely.

The project's goal is to empower developers to understand how their applications is behaving in production with minimal performance impact and without vendor lock-in.

The library is in alpha stage and the API is subject to change.

I expect that the library will not match everyone use-cases, so I'm asking everyone in this case to open an issue so we can discuss how the toolkit could meet yours.

## Use cases

### An application have a memory leak

The recommended profiler is the [Heap Sampling Profiler](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-inspector-heap-profiler) which has the lowest impact in terms of performance, [here are the instructions on how to use it](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-inspector-heap-profiler#how-to-use).
After getting the exported file, you can go to [speedscope](https://www.speedscope.app/) to analyse it.
[If we load an example heap profile](https://www.speedscope.app/#profileURL=https%3A%2F%2Frawcdn.githack.com%2Fvmarchaud%2Fopenprofiling-node%2F475c1f31e5635cd9230c9296549dfbf9765a7464%2Fexamples%2Fprofiles%2Fsimple.heapprofile) and head to the `Sandwich` panel, we can see a list of functions sorted by how much memory they allocated.

Note that the top function in the view should be automatically considered as a leak: for example, when you receive a HTTP request, NodeJS allocates some memory for it but it will be freed after the request finishes. The view will only show where memory is allocated, not where it leaks.

### An application is using too much CPU

The recommended profiler is the [CPU JS Sampling Profiler](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-inspector-cpu-profiler) which is made for production profiling (low overhead), [check the instructions to get it running](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-inspector-cpu-profiler#how-to-use).
After getting the exported file, you can go to [speedscope](https://www.speedscope.app/) to analyze it.
[If we load an example CPU profile](https://www.speedscope.app/#profileURL=https%3A%2F%2Frawcdn.githack.com%2Fvmarchaud%2Fopenprofiling-node%2F475c1f31e5635cd9230c9296549dfbf9765a7464%2Fexamples%2Fprofiles%2Fheavy.cpuprofile) and head to the `Sandwich` panel again, we can see a list of functions sorted by how much CPU they used.

Note that there is two concepts of "time used":
- `self`: which is the time the CPU took in the function **itself**, without considering calling other functions.
- `total`: the opposite of `self`, it represent **both the time used by the function and all functions that it called**.

You should then look for functions that have a high `self` time, which means that their inner code take a lot of time to execute.


## Installation

Install OpenProfiling for NodeJS with:

```bash
yarn add @openprofiling/nodejs
```

or

```bash
npm install @openprofiling/nodejs
```

## Configure

Before running your application with `@openprofiling/nodejs`, you will need to choose 3 different things:
- What do you want to profile: a `profiler`
- How to start this profiler: a `trigger`
- Where to send the profiling data: an `exporter`

### Typescript Example

```ts
import { ProfilingAgent } from '@openprofiling/nodejs'
import { FileExporter } from '@openprofiling/exporter-file'
import { InspectorHeapProfiler } from '@openprofiling/inspector-heap-profiler'
import { InspectorCPUProfiler } from '@openprofiling/inspector-cpu-profiler'
import { SignalTrigger } from '@openprofiling/trigger-signal'

const profilingAgent = new ProfilingAgent()
/**
 * Register a profiler for a specific trigger
 * ex: we want to collect cpu profile when the application receive a SIGUSR2 signal
 */
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorCPUProfiler({}))
/**
 * Start the agent (which will tell the trigger to start listening) and
 * configure where to output the profiling data
 * ex: the file exporter will output on the disk, by default in /tmp
 */
profilingAgent.start({ exporter: new FileExporter() })
```

### JavaScript Example

```js
const { ProfilingAgent } = require('@openprofiling/nodejs')
const { FileExporter } = require('@openprofiling/exporter-file')
const { InspectorCPUProfiler } = require('@openprofiling/inspector-cpu-profiler')
const { SignalTrigger } = require('@openprofiling/trigger-signal')

const profilingAgent = new ProfilingAgent()
/**
 * Register a profiler for a specific trigger
 * ex: we want to collect cpu profile when the application receive a SIGUSR2 signal
 */
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR1' }), new InspectorCPUProfiler({}))
/**
 * Start the agent (which will tell the trigger to start listening) and
 * configure where to output the profiling data
 * ex: the file exporter will output on the disk, by default in /tmp
 */
profilingAgent.start({ exporter: new FileExporter(), logLevel: 4 })
```

## Triggers

A trigger is simply a way to start collecting data, you can choose between those:

- [Signal](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-trigger-signal)
- [HTTP](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-trigger-http)

## Profilers

Profilers are the implementation that collect profiling data from different sources, current available profilers:

- [CPU Sampling JS Profiler](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-inspector-cpu-profiler)
- [Heap Sampling Profiler](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-inspector-heap-profiler)
- [Heap Snapshot](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-inspector-heapsnapshot)
- [Trace Events](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-inspector-trace-events)

## Exporters

OpenProfiling aims to be vendor-neutral and can push profiling data to any backend with different exporter implementations. Currently, it supports:

- [File exporter](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-exporter-file)
- [S3 exporter](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-exporter-s3)

## Versioning

This library follows [Semantic Versioning](http://semver.org/).

Note that before the 1.0.0 release, any minor update can have breaking changes.

## LICENSE

Apache License 2.0

[npm-url]: https://www.npmjs.com/package/@openprofiling/core.svg
[linter-img]: https://img.shields.io/badge/linter-ts--standard-brightgreen.svg
[node-img]: https://img.shields.io/node/v/@openprofiling/core.svg
[license-image]: https://img.shields.io/badge/license-Apache_2.0-green.svg?style=flat
