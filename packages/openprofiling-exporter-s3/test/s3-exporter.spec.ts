
import { S3Exporter, fileExtensions } from '../src'
import * as assert from 'assert'
import { Profile, ProfileType, CoreAgent, Exporter } from '@openprofiling/core'
import * as SMCloudStore from 'smcloudstore'

describe('Exporter File', () => {
  let exporter: Exporter
  let agent = new CoreAgent()
  const options = {
    endPoint: process.env.S3_HOST || 'localhost',
    port: process.env.S3_PORT ? parseInt(process.env.S3_PORT, 10) : 9000,
    accessKey: process.env.S3_ACCESS_KEY || 'accessKey',
    secretKey: process.env.S3_SECRET_KEY || 'secretKey',
    bucket: 'test-s3-bucket',
    useSSL: false
  }
  let storage = SMCloudStore.Create('generic-s3', options)
  const getProfilePath = (profile: Profile) => {
    const extension = fileExtensions[profile.kind]
    return `${profile.kind.toLowerCase()}-${profile.startTime.toISOString()}.${extension}`
  }

  it('should export a exporter implementation', () => {
    assert(typeof S3Exporter.prototype.onProfileEnd === 'function')
    assert(typeof S3Exporter.prototype.onProfileStart === 'function')
  })

  it('should throw if no options is given in the constructor', () => {
    assert.throws(() => {
      exporter = new S3Exporter()
    })
    assert.throws(() => {
      // @ts-ignore
      exporter = new S3Exporter({})
    })
  })

  it('should throw because of wrong creds', async () => {
    exporter = new S3Exporter({
      endPoint: 'localhost',
      accessKey: process.env.S3_ACCESS_KEY || 'accessKey',
      secretKey: process.env.S3_SECRET_KEY || 'secretKey',
      bucket: 'toto'
    })
    exporter.enable(agent)
    const profile = new Profile('test', ProfileType.CPU_PROFILE)
    profile.addProfileData(Buffer.from('test'))
    profile.end()
    await assert.rejects(() => exporter.onProfileEnd(profile))
  })

  it('should succesfully upload profile', async () => {
    exporter = new S3Exporter(options)
    exporter.enable(agent)
    const profile = new Profile('test', ProfileType.CPU_PROFILE)
    profile.addProfileData(Buffer.from('test'))
    profile.end()
    await assert.doesNotReject(() => exporter.onProfileEnd(profile))
    await assert.doesNotReject(() => storage.isContainer(options.bucket))
    const storedProfile = await storage.getObjectAsBuffer(options.bucket, getProfilePath(profile))
    assert(storedProfile.toString() === 'test')
  })
})
