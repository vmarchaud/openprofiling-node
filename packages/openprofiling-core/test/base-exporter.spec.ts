
import { BaseExporter, CoreAgent } from '../src'
import * as assert from 'assert'
import { DummyExporter } from './mocks/dummyExporter'

describe('Base Exporter test', () => {

  it('should have correct methods', () => {
    assert(typeof BaseExporter.prototype.enable === 'function')
    assert(typeof BaseExporter.prototype.disable === 'function')
    assert(BaseExporter.prototype.onProfileStart === undefined)
    assert(BaseExporter.prototype.onProfileEnd === undefined)
  })

  it('should create implementation and disable it', () => {
    const agent = new CoreAgent()
    agent.start({
      reactions: [],
      logLevel: 0
    })
    const exporter = new DummyExporter()
    assert.doesNotThrow(() => {
      exporter.enable(agent)
    })
    // @ts-ignore
    assert(typeof exporter.logger === 'object')
    // @ts-ignore
    assert(exporter.agent === agent)
    // @ts-ignore
    assert(exporter.name === 'dummy')
    assert.doesNotThrow(() => {
      exporter.disable()
    })
  })
})
