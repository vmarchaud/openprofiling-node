
import { WebsocketGateway } from './index'

const options = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8080
}

// tslint:disable-next-line
new WebsocketGateway(options)
