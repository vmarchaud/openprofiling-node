
import { Profile, ExporterOptions, BaseExporter } from '@openprofiling/core'
import * as SMCloudStore from 'smcloudstore'
import { StorageProvider } from '@smcloudstore/core/dist/StorageProvider'

export interface S3ExporterConfig extends ExporterOptions {
  region?: string
  accessKey: string
  secretKey: string
  useSSL?: boolean
  port?: number
  endPoint: string
  bucket: string
}

export const fileExtensions = {
  'HEAP_PROFILE': 'heapprofile',
  'CPU_PROFILE': 'cpuprofile',
  'HEAP_SNAPSHOT': 'heapsnapshot',
  'PERFECTO': 'json'
}

export class S3Exporter extends BaseExporter {

  private config: S3ExporterConfig
  private storage: StorageProvider

  constructor (options?: S3ExporterConfig) {
    super('s3', options)
    if (typeof options === 'object') {
      this.config = options
    } else {
      throw new Error('You must pass options to the S3Exporter')
    }
    this.storage = SMCloudStore.Create('generic-s3', this.config)
  }

  async onProfileStart (profile: Profile) {
    return
  }

  async onProfileEnd (profile: Profile) {
    const extension = fileExtensions[profile.kind]
    const filename = `${profile.kind.toLowerCase()}-${profile.startTime.toISOString()}.${extension}`
    const metadata = Object.assign({
      kind: profile.kind,
      startTime: profile.startTime.toISOString(),
      endTime: profile.endTime.toISOString(),
      duration: profile.duration,
      status: profile.status
    }, profile.attributes)
    await this.storage.ensureContainer(this.config.bucket)
    await this.storage.putObject(this.config.bucket, filename, profile.data, { metadata })
  }
}
