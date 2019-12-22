import { GcloudStorageExporter, fileExtensions } from '../src'
import * as assert from 'assert'
import { Profile, ProfileType, CoreAgent, Exporter } from '@openprofiling/core'
import { Storage } from '@google-cloud/storage'
import { URL } from 'url'

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
process.on('unhandledRejection', err => { throw err })

describe('GCS Exporter', () => {
  let exporter: Exporter
  let agent = new CoreAgent()
  const fakeGCSHost = process.env.GCS_HOST || `localhost:4443`
  const options = {
    apiEndpoint: fakeGCSHost,
    bucket: 'test-gcs-bucket',
    projectId: 'test',
    useSSL: false
  }
  let storage = new Storage(options)
  const interceptor = {
    request: function (reqOpts) {
      const url = new URL(reqOpts.uri)
      url.host = fakeGCSHost
      reqOpts.uri = url.toString()
      return reqOpts
    }
  }
  // @ts-ignore Used to modify url to our fake instance
  storage.interceptors.push(interceptor)

  const getProfilePath = (profile: Profile) => {
    const extension = fileExtensions[profile.kind]
    return `${profile.kind.toLowerCase()}-${profile.startTime.toISOString()}.${extension}`
  }

  it('should export a exporter implementation', () => {
    assert(typeof GcloudStorageExporter.prototype.onProfileEnd === 'function')
    assert(typeof GcloudStorageExporter.prototype.onProfileStart === 'function')
  })

  it('should throw if no options is given in the constructor', () => {
    assert.throws(() => {
      exporter = new GcloudStorageExporter()
    })
    assert.throws(() => {
      // @ts-ignore
      exporter = new GcloudStorageExporter({})
    })
  })

  it('should throw because of wrong creds', async () => {
    exporter = new GcloudStorageExporter({
      apiEndpoint: fakeGCSHost,
      bucket: 'test-gcs-bucket'
    })
    exporter.enable(agent)
    const profile = new Profile('test', ProfileType.CPU_PROFILE)
    profile.addProfileData(Buffer.from('test'))
    profile.end()
    await assert.rejects(() => exporter.onProfileEnd(profile))
  })

  it('should succesfully upload profile', async () => {
    exporter = new GcloudStorageExporter(options)
    // @ts-ignore Used to modify url to our fake instance
    exporter.storage.interceptors.push(interceptor)
    exporter.enable(agent)
    const profile = new Profile('test', ProfileType.CPU_PROFILE)
    profile.addProfileData(Buffer.from('test'))
    profile.end()
    await assert.doesNotReject(() => exporter.onProfileEnd(profile))
    const bucket = storage.bucket(options.bucket)
    const [ exists ] = await bucket.exists()
    assert(exists === true)
    const file = bucket.file(getProfilePath(profile))
    const fileExists = await file.exists()
    assert(fileExists[0] === true)
  })
})
