<p align="center">
  <img width="460" height="150" src="https://svgshare.com/i/Cte.svg">
  </a>
</p>


[![Version](https://img.shields.io/npm/v/@openprofiling/core.svg)](https://img.shields.io/npm/v/@openprofiling/core.svg)
[![Build Status](https://cloud.drone.io/api/badges/vmarchaud/openprofiling-node/status.svg)](https://cloud.drone.io/vmarchaud/openprofiling-node)
[![codecov](https://codecov.io/gh/vmarchaud/openprofiling-node/branch/master/graph/badge.svg)](https://codecov.io/gh/vmarchaud/openprofiling-node)
[![License](https://img.shields.io/npm/l/@opencensus/core.svg)](https://img.shields.io/npm/l/@opencensus/core.svg)


OpenProfiling is a toolkit for collecting profiling data from production workload safely.

The project's goal is to empower developers to understand how they applications is behaving in production with minimal performance impact and without vendor lock-in.

The library is in alpha stage and the API is subject to change.

I expect that the library will not match everyone use-cases, so i'm asking to everyone in this case to open an issue so we can discuss how the toolkit could meet yours.

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

Before running your application with `@openprofiling/nodejs`, you will need choose 3 different things:
- What do you want to profile: an `profiler`
- How to start this profiler: an `trigger`
- Where to send the profiling data: an `exporter`

Then, the API is pretty straigthforward (example are in typescript):

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
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorCPUProfiler())
/**
 * Start the agent (which will tell the trigger to start listening) and
 * configure where to output the profiling data
 * ex: the file exporter will output on the disk, by default in /tmp
 */
profilingAgent.start({ exporter: new FileExporter() })
```

## Triggers

A trigger is simply a way to start collecting data, you can choose between those:

- [Signal](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-trigger-signal)
- [HTTP](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-trigger-http)

## Profilers

Profilers are the implementation that collect profiling data from different sources, current available profilers:

- [CPU Sampling JS Profiler](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-inspector-cpu-profiler)
- [Heap Sampling Profiler](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-inspector-heap-profiler)

## Exporters

OpenProfiling aim to be vendor-neutral and can push profiling data to any backend with different exporter implementations. Currently, it supports:

- [File exporter](https://github.com/vmarchaud/openprofiling-node/tree/master/packages/openprofiling-exporter-file)

## Versioning

This library follows [Semantic Versioning](http://semver.org/).

Note that before the 1.0.0 release, any minor update can have breaking changes.

## LICENSE

Apache License 2.0

[npm-url]: https://www.npmjs.com/package/@openprofiling/core.svg
[linter-img]: https://img.shields.io/badge/linter-ts--standard-brightgreen.svg
[node-img]: https://img.shields.io/node/v/@openprofiling/core.svg
[license-image]: https://img.shields.io/badge/license-Apache_2.0-green.svg?style=flat
