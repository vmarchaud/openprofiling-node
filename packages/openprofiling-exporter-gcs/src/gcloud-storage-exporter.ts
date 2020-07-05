
import { Profile, ExporterOptions, BaseExporter } from '@openprofiling/core'
import { Storage, StorageOptions, Bucket } from '@google-cloud/storage'
import { Duplex } from 'stream'

export interface GcloudStorageExporterConfig extends ExporterOptions, StorageOptions {
  keyFilename?: string
  projectId?: string
  bucket: string
}

export const fileExtensions = {
  'HEAP_PROFILE': 'heapprofile',
  'CPU_PROFILE': 'cpuprofile',
  'PERFECTO': 'json'
}

export class GcloudStorageExporter extends BaseExporter {

  private config: GcloudStorageExporterConfig
  private storage: Storage

  constructor (options?: GcloudStorageExporterConfig) {
    super('gcloud-storage', options)
    if (typeof options === 'object') {
      this.config = options
      // tslint:disable-next-line
      if (this.config.bucket === undefined) {
        throw new Error(`You must pass at least the bucket name`)
      }
    } else {
      throw new Error('You must pass options to the GcloudStorageExporter')
    }
    this.storage = new Storage(this.config)
  }

  async onProfileStart (profile: Profile) {
    return
  }

  async onProfileEnd (profile: Profile) {
    const extension = fileExtensions[profile.kind]
    const filename = `${profile.kind.toLowerCase()}-${profile.startTime.toISOString()}.${extension}`
    const metadata = Object.assign({
      kind: profile.kind.toString(),
      startTime: profile.startTime.toISOString(),
      endTime: profile.endTime.toISOString(),
      duration: profile.duration.toString(),
      status: profile.status.toString()
    }, Object.entries(profile.attributes).reduce((agg, [key, value]) => {
      agg[key] = value.toString()
      return agg
    }, {}))
    // ensure the bucket exists
    const bucket = await this.ensureBucket()
    await this.upload(bucket, filename, profile.data, { metadata })
  }

  private async ensureBucket () {
    const bucket = this.storage.bucket(this.config.bucket)
    const [ exists ] = await bucket.exists()
    if (exists === true) return bucket
    await bucket.create()
    return bucket
  }

  private async upload (bucket: Bucket, path: string, data: Buffer, metadata: unknown) {
    const file = bucket.file(path)
    return new Promise((resolve, reject) => {
      const stream = new Duplex()
      stream.push(data)
      stream.push(null)
      stream.pipe(file.createWriteStream({
        predefinedAcl: 'publicRead',
        resumable: false,
        metadata: Object.assign({}, metadata),
        validation: 'crc32c'
      })).on('error', reject).on('finish', resolve)
    })
  }
}
