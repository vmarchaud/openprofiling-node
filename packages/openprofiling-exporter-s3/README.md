# OpenProfiling NodeJS - S3 Exporter

This exporter is advised when profiling distributed applications where retrieving from each container file system can be hard.
It will just write the profile to a remote S3-compatible server, the file name in each bucket will follow the following format:

```js
const name = `${profile.kind}-${profile.startTime.toISOString()}.${profile.extension}`
```

Where the profile kind can be: `HEAP_PROFILE`, `CPU_PROFILE` or `HEAP_SNAPSHOT`
And the extension can be either: `heaprofile`, `cpuprofile` or `heapsnapshot`

### Advantages

- Centralization of every profile, prefered when using containers

### Drawbacks

- You need to have a S3 compatible running (or AWS S3 itself) and manage it yourself.

### How to use

In the following example, when the profile will be done it will be written to the remote S3 bucket:

```ts
import { ProfilingAgent } from '@openprofiling/nodejs'
import { S3Exporter } from '@openprofiling/exporter-s3'
import { InspectorCPUProfiler } from '@openprofiling/inspector-cpu-profiler'
import { SignalTrigger } from '@openprofiling/trigger-signal'

const profilingAgent = new ProfilingAgent()
profilingAgent.register(new SignalTrigger({ signal: 'SIGUSR2' }), new InspectorCPUProfiler())
profilingAgent.start({
  exporter: new S3Exporter({
    /**
     * string representing the endpoint of the server to connect to; for AWS S3, set this to s3.amazonaws.com and the library will pick the correct endpoint based on the connection.region argument (default: 'us-east-1') 
     */
    endPoint: '',
    /*
    * (optional): string containing the AWS region to use, useful for connecting to AWS S3
    */
    region: '',
    /*
    * string containing the access key (the "public key")
    */
    accessKey: '',
    /*
    * string containing the secret key
    */
    secretKey: '',
    /*
    * (optional): boolean that will force the connection using HTTPS if true (default: true)
    */
    useSSL: true,
    /*
    * (optional): number representing the port to connect to; defaults to 443 if useSSL is true, 80 otherwise
    */
    port: 443,
    /*
    * name of the bucket to create
    */
    bucket: 'test'
  }
})
```

## Development

When developing against this package, you might want to run a simple s3 server with Minio to be able to run tests and verify the behavior:

```bash
docker run -p 9000:9000 -e "MINIO_ACCESS_KEY=accessKey" -e "MINIO_SECRET_KEY=secretKey" minio/minio server /data
```