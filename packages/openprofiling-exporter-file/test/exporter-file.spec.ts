
import { FileExporter, fileExtensions } from '../src'
import * as assert from 'assert'
import { Profile, ProfileType, CoreAgent } from '@openprofiling/core'
import { tmpdir } from 'os'
import { resolve } from 'path'
import { readFile, mkdir } from 'fs'

describe('Exporter File', () => {
  let exporter = new FileExporter()
  let agent = new CoreAgent()
  agent.start({ logLevel: 4, reactions: [] })
  exporter.enable(agent)

  it('should export a profiler implementation', () => {
    assert(typeof FileExporter.prototype.onProfileEnd === 'function')
    assert(typeof FileExporter.prototype.onProfileStart === 'function')
  })

  it('should correctly save the profile to disk', (done) => {
    const profile = new Profile('test', ProfileType.CPU_PROFILE)
    profile.addProfileData(Buffer.from('test'))
    profile.end()
    const expectedPath = resolve(tmpdir(), `${profile.kind.toLowerCase()}-${profile.startTime.toISOString()}.${fileExtensions[profile.kind]}`)
    exporter.onProfileEnd(profile).then().catch(done)
    // without waiting, it could be race between the reading and the writing
    setTimeout(_ => {
      readFile(expectedPath, (err, buffer) => {
        assert.ifError(err)
        assert(buffer.toString() === 'test')
        return done(err)
      })
    }, 200)
  })

  it('should correctly save the profile to disk with custom path', (done) => {
    const customPath = resolve(tmpdir(), 'exporter-file-test')
    mkdir(customPath, _err => {
      return
    })
    exporter = new FileExporter({
      path: customPath
    })
    exporter.enable(agent)
    const profile = new Profile('test', ProfileType.CPU_PROFILE)
    profile.addProfileData(Buffer.from('test'))
    profile.end()
    const expectedPath = resolve(customPath, `${profile.kind.toLowerCase()}-${profile.startTime.toISOString()}.${fileExtensions[profile.kind]}`)
    exporter.onProfileEnd(profile).then().catch(done)
    // without waiting, it could be race between the reading and the writing
    setTimeout(_ => {
      readFile(expectedPath, (err, buffer) => {
        assert.ifError(err)
        assert(buffer.toString() === 'test')
        return done(err)
      })
    }, 200)
  })
})
