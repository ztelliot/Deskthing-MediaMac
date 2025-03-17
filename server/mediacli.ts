import { DeskThing, SongData } from 'deskthing-server';
import { exec } from 'child_process';


type MediaData = {
  totalDiscCount?: number;
  shuffleMode?: number; // 0 = off, 1 = items, 2 = collections
  trackNumber?: number;
  duration?: number;
  repeatMode?: number; // 0 = off, 1 = one, 2 = all
  title?: string;
  playbackRate?: number;
  artworkData?: string;
  artworkDataWidth?: number;
  artworkDataHeight?: number;
  artworkIdentifier?: string;
  artworkMIMEType?: string;
  album?: string;
  totalQueueCount?: number;
  mediaType?: string;
  discNumber?: number;
  timestamp?: number;
  genre?: string;
  queueIndex?: number;
  artist?: string;
  defaultPlaybackRate?: number;
  elapsedTime?: number;
  totalTrackCount?: number;
  isMusicApp?: boolean;
  contentItemIdentifier?: string;
  uniqueIdentifier?: string;
  bundleIdentifier?: string;
  displayName?: string;
  isPlaying?: boolean;
  volume?: number;
  deviceID?: number;
  deviceName?: string;
}

class MediaCLI {
  DeskThing: DeskThing;

  constructor(DeskThing) {
    this.DeskThing = DeskThing
  }

  async returnSongData(id = null, retryCount = 0) {
    try {
      const result = await this.getInfo();
      if (result === null) {
        this.DeskThing.sendError('Music Data returned false! There was an error');
        return result;
      } else {
        // Check if result.id is different from the passed id
        if (result.id !== id) {
          this.DeskThing.sendLog('Returning song data');

          return result;
        } else {
          // Retry logic up to 5 attempts
          if (retryCount < 5) {
            this.DeskThing.sendLog(`Retry attempt ${retryCount + 1} for next command.`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
            return this.returnSongData(id, retryCount + 1); // Recursive call with incremented retryCount
          } else {
            this.DeskThing.sendError(`Reached maximum retry attempts for next command.`);
            return null;
          }
        }
      }
    } catch (error) {
      this.DeskThing.sendError(`Error executing next command: ${error}`);
      return null;
    }
  }

  async getInfo() {
    const result = await this.executeCommand('get') as MediaData;
    if (result === null) {
      this.DeskThing.sendError('Music Data returned false! There was an error');
      return result;
    } else {
      const musicData: SongData = {
        album: result?.album ?? null,
        artist: result?.artist ?? null,
        playlist: null,
        playlist_id: null,
        track_name: result?.title ?? '',
        shuffle_state: result?.shuffleMode !== undefined ? result?.shuffleMode > 0 : null,
        repeat_state: result?.repeatMode !== undefined ? (result?.repeatMode === 0 ? 'off' : result?.repeatMode === 1 ? 'track' : 'all') : 'off',
        is_playing: result?.isPlaying ?? (result?.playbackRate ?? 0) > 0,
        can_fast_forward: true,
        can_skip: true,
        can_like: false,
        can_change_volume: result?.volume !== null,
        can_set_output: result?.deviceID !== null,
        track_duration: result?.duration ? Math.round(result?.duration * 1000) : null,
        track_progress: result?.elapsedTime ? Math.round(result?.elapsedTime * 1000) : null,
        volume: result?.volume ? Math.round(result?.volume * 100) : 0,
        thumbnail: result?.artworkData ? "data:" + (result?.artworkMIMEType ?? 'image/png') + ";base64," + result?.artworkData : null,
        device: result?.deviceName ?? null,
        id: result?.contentItemIdentifier ?? null,
        device_id: result?.deviceID?.toString() ?? null,
      }
      return musicData;
    }
  }

  async chmodCLI() {
    return new Promise((resolve, reject) => {
      exec(`chmod +x "${__dirname}/media-cli"`, (error) => {
        if (error) {
          this.DeskThing.sendError(`exec error: ${error}`);
          reject(false);
          return;
        }
        resolve(true);
      });
    });
  }

  async executeCommand(command, args: string | number = '') {
    this.DeskThing.sendLog(`Executing command: ${command} ${args}`);
    return new Promise((resolve, reject) => {
      exec(`"${__dirname}/media-cli" ${command} ${args}`, (error, stdout) => {
        if (error) {
          this.DeskThing.sendError(`exec error: ${error}`);
          reject(null);
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (!result?.success) {
            this.DeskThing.sendError('Error executing command:' + result?.msg);
            reject(null);
            return;
          }
          resolve(result?.data ?? true);
        } catch (parseError) {
          this.DeskThing.sendError('Error parsing JSON:' + parseError);
          reject(null);
        }
      });
    });
  }

  async next(id) {
    // const result = await this.executeCommand('next');
    // if (result) {
    //   return await this.returnSongData(id)
    // }
    // return false;
    return this.executeCommand('next');
  }

  async previous() {
    return this.executeCommand('previous');
  }

  async skip(seconds: number) {
    return this.executeCommand('skip', seconds);
  }

  async play() {
    return this.executeCommand('play');
  }

  async pause() {
    return this.executeCommand('pause');
  }

  async stop() {
    const cmd1 = this.executeCommand('pause');
    const cmd2 = this.executeCommand('seek', 0);
    return Promise.all([cmd1, cmd2]);
  }

  async seek(positionMs: number) {
    const position = Math.round(positionMs / 1000);
    return this.executeCommand('seek', position);
  }

  async volume(volume) {
    volume = volume / 100;
    return this.executeCommand('volume', volume);
  }

  async getDevices() {
    return this.executeCommand('devices');
  }

  async device(deviceID) {
    return this.executeCommand('device', deviceID);
  }
}

export default MediaCLI;
