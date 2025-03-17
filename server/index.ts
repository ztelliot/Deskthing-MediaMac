import MediaCLI from './mediacli.ts'
import { DeskThing as DK } from 'deskthing-server'
const DeskThing = DK.getInstance()
export { DeskThing }

let mediacli

const start = async () => {
  DeskThing.sendLog('Starting MediaMac')
  mediacli = new MediaCLI(DeskThing)
  await mediacli.chmodCLI()

  let Data = await DeskThing.getData()
  DeskThing.on('data', async (newData) => {
    DeskThing.sendLog('Data Updated: ' + JSON.stringify(newData))
    if (newData?.settings?.change_source?.value && newData?.settings?.output_source?.value !== '0') {
      if (Data?.settings?.output_source?.value != newData?.settings?.output_source?.value) {
        DeskThing.sendLog('Changing Output Device: ' + Data?.settings?.output_source?.value + ' -> ' + newData?.settings?.output_source?.value)
        await mediacli.device(newData?.settings?.output_source?.value)
        DeskThing.sendLog('Output Device Changed')
      }
    }
    Data = newData
  })

  DeskThing.sendLog('Getting Devices')
  const devices = await mediacli.getDevices()
  DeskThing.addSettings({
    "change_source": {
      type: 'boolean',
      description: "Switch Output on Select",
      label: "Switch Output on Select",
      value: true,
    },
    "output_source": {
      type: 'select',
      description: "Default Output Device",
      label: "Default Output Device",
      value: "0",
      options: [{
        value: "0",
        label: "Default"
      }, ...devices.map((device) => {
        return {
          value: device?.id.toString(),
          label: device?.name // + (device?.isDefault ? ' (Default)' : '')
        }
      }
      )]
    }
  })

  DeskThing.on('get', handleGet)
  DeskThing.on('set', handleSet)
}

DeskThing.on('start', start)


const handleGet = async (data) => {
  DeskThing.sendLog('Receiving Get Data: ' + JSON.stringify(data))
  if (data == null) {
    DeskThing.sendError('No args provided')
    return
  }
  let response
  switch (data.request) {
    case 'song':
    case 'refresh':
      response = await mediacli.returnSongData()
      DeskThing.send('data', { app: "client", type: "song", payload: response });
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
  DeskThing.sendLog('Receiving Set Data: ' + JSON.stringify(data))
  let response
  switch (data.request) {
    case 'next':
      response = await mediacli.next(data.payload)
      // if (response) {
      //   DeskThing.send('data', { app: 'client', type: 'song', payload: response })
      // }
      break
    case 'previous':
      response = await mediacli.previous()
      break
    case 'fast_forward':
      response = await mediacli.skip(data.payload)
      break
    case 'rewind':
      response = await mediacli.skip(-data.payload)
      break
    case 'play':
      response = await mediacli.play()
      break
    case 'pause':
      response = await mediacli.pause()
      break
    case 'stop':
      response = await mediacli.stop()
      break
    case 'seek':
      response = await mediacli.seek(data.payload)
      break
    case 'volume':
      response = await mediacli.volume(data.payload)
      break
    default:
      response = "Not implemented"
      break
  }
}
