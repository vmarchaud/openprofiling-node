# Contributing Guide

The openprofiling-node is written in TypeScript.

The command `npm test` tests code the same way that our CI will test it.
This is a convenience command for a number of steps, which can run separately if needed:

- `npm run compile` compiles the code, checking for type errors.
- `npm run bootstrap` Bootstrap the packages in the current Lerna repo. Installs all of their dependencies and links any cross-dependencies.

# How to become a contributor and submit your own code

1. Submit an issue describing your proposed change to the repo in question.
1. The repo owner will respond to your issue promptly.
1. Fork the desired repo, develop and test your code changes.
1. Submit a pull request.
1. If your proposed change is accepted, and you haven't already done so, sign a Contributor License Agreement (see details above).