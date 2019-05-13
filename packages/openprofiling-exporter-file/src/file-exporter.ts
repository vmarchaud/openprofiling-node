
import { Profile, ExporterOptions, BaseExporter } from '@openprofiling/core'
import * as fs from 'fs'
import { tmpdir } from 'os'
import { resolve } from 'path'

export interface FileExporterConfig extends ExporterOptions {
  path: string
}

const defaultFileExporterConfig: FileExporterConfig = {
  path: tmpdir()
}

export const fileExtensions = {
  'HEAP_PROFILE': 'heapprofile',
  'CPU_PROFILE': 'cpuprofile',
  'HEAP_SNAPSHOT': 'heapsnapshot'
}

export class FileExporter extends BaseExporter {

  private config: FileExporterConfig = defaultFileExporterConfig

  constructor (options?: FileExporterConfig) {
    super('file', options)
    if (typeof options === 'object') {
      this.config = options
    }
  }

  onProfileStart (profile: Profile) {
    return
  }

  onProfileEnd (profile: Profile) {
    const extension = fileExtensions[profile.kind]
    const filename = `${profile.kind.toLowerCase()}-${profile.startTime.toISOString()}.${extension}`
    const targetPath = resolve(this.config.path, filename)
    fs.writeFile(targetPath, profile.data, (err) => {
      if (err) {
        this.logger.error(`Error while writing profile to disk`, err.message)
      } else {
        this.logger.info(`File written to ${filename}`)
      }
    })
  }

}
