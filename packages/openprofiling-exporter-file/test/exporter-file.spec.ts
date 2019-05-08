
import { FileExporter } from '../src'
import * as assert from 'assert'
import { Profile, ProfileType } from '@openprofiling/core'
import { tmpdir } from 'os'
import { resolve } from 'path'
import { readFile, mkdirSync } from 'fs'

describe('Exporter File', () => {
  let exporter = new FileExporter()

  it('should export a profiler implementation', () => {
    assert(typeof FileExporter.prototype.onProfileEnd === 'function')
    assert(typeof FileExporter.prototype.onProfileStart === 'function')
  })

  it('should correctly save the profile to disk', (done) => {
    const profile = new Profile('test', ProfileType.CPU_PROFILE)
    profile.addProfileData(Buffer.from('test'))
    profile.end()
    const expectedPath = resolve(tmpdir(), `${profile.kind.toLowerCase()}-${profile.startTime}-${profile.name}`)
    exporter.onProfileEnd(profile)
    readFile(expectedPath, (err, buffer) => {
      assert.ifError(err)
      assert(buffer.toString() === 'test')
      return done()
    })
  })

  it('should correctly save the profile to disk with custom path', (done) => {
    const customPath = resolve(tmpdir(), 'exporter-file-test')
    mkdirSync(customPath)
    exporter = new FileExporter({
      path: customPath
    })
    const profile = new Profile('test', ProfileType.CPU_PROFILE)
    profile.addProfileData(Buffer.from('test'))
    profile.end()
    const expectedPath = resolve(customPath, `${profile.kind.toLowerCase()}-${profile.startTime}-${profile.name}`)
    exporter.onProfileEnd(profile)
    readFile(expectedPath, (err, buffer) => {
      assert.ifError(err)
      assert(buffer.toString() === 'test')
      return done()
    })
  })
})
