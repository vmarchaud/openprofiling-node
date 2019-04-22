'use strict'

import { Exporter, Profile } from '@openprofiling/core'
import * as fs from 'fs'
import { tmpdir } from 'os'
import { resolve } from 'path'

export class FileExporterConfig {
  path: string
}

const defaultFileExporterConfig: FileExporterConfig = {
  path: tmpdir()
}

export class FileExporter implements Exporter {

  private config: FileExporterConfig = defaultFileExporterConfig

  constructor (options?: FileExporterConfig) {
    if (typeof options === 'object') {
      this.config = options
    }
  }

  onProfileStart (profile: Profile) {
    return
  }

  onProfileEnd (profile: Profile) {
    const filename = `${profile.kind.toLowerCase()}-${profile.startTime}-${profile.name}`
    const targetPath = resolve(this.config.path, filename)
    fs.writeFile(targetPath, profile.data, (err) => {
      if (err) {
        console.error(`Error while writing profile to disk`, err.message)
      } else {
        console.log(`File written to ${filename}`)
      }
    })
  }

}
