import MediaMacHandler from './mediamac.js'
import { DeskThing as DK } from 'deskthing-server'
const DeskThing = DK.getInstance()
export { DeskThing }

let mediamac

const start = async () => {
  mediamac = new MediaMacHandler(DeskThing)

  let Data = await DeskThing.getData()
  DeskThing.on('data', (newData) => {
    Data = newData
  })

  if (!Data.settings?.change_source) {
    const settings = {
      "change_source": {
        "value": 'true',
        "label": "Switch Output on Select",
        "type": "boolean"
      },
    }
    DeskThing.addSettings(settings)
  }

  DeskThing.on('get', handleGet)
  DeskThing.on('set', handleSet)
}

DeskThing.on('start', start)


const handleGet = async (data) => {
  console.log('Receiving Get Data', data)
  if (data == null) {
    DeskThing.sendError('No args provided')
    return
  }
  let response
  switch (data.request) {
    case 'song':
      response = await mediamac.returnSongData()
      response = { app: 'client', type: 'song', payload: response }
      DeskThing.sendDataToClient(response)
      break
    case 'refresh':
      response = await mediamac.checkForRefresh()
      if (response) {
        response = { app: 'client', type: 'song', payload: response }
        DeskThing.sendDataToClient(response)
      }
      break
    default:
      DeskThing.sendError(`Unknown request: ${data.request}`)
      break
  }
}

const handleSet = async (data) => {
  if (data == null) {
    DeskThing.sendError('No args provided')
    return
  }
  DeskThing.sendLog('Receiving Set Data' + data)
  console.log('Receiving Set Data', data)
  let response
  switch (data.request) {
    case 'next':
      response = await mediamac.next(data.payload)
      if (!response == false) {
        response = { app: 'client', type: 'song', payload: response }
        DeskThing.sendDataToClient(response)
      }
      break
    case 'previous':
      response = await mediamac.previous()
      break
    case 'fast_forward':
      response = await mediamac.skip(data.payload)
      break
    case 'rewind':
      response = await mediamac.skip(-data.payload)
      break
    case 'play':
      response = await mediamac.play()
      break
    case 'pause':
      response = await mediamac.pause()
      break
    case 'stop':
      response = await mediamac.stop()
      break
    case 'seek':
      response = await mediamac.seek(data.payload)
      break
    default:
      response = "Not implemented"
      break
  }
}
