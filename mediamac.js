import { exec } from 'child_process';

class MediaMac {
  constructor(DeskThing) {
    this.DeskThing = DeskThing
  }

  async sendLog(message) {
    this.DeskThing.sendLog(message)
  }
  async sendError(message) {
    this.DeskThing.sendError(message)
  }

  async returnSongData(id = null, retryCount = 0) {
    try {
      const result = await this.getInfo();
      if (result === false) {
        this.sendError('Music Data returned false! There was an error');
        return false;
      } else {
        // Check if result.id is different from the passed id
        if (result.id !== id) {
          this.sendLog('Returning song data');

          return result;
        } else {
          // Retry logic up to 5 attempts
          if (retryCount < 5) {
            this.sendLog(`Retry attempt ${retryCount + 1} for next command.`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
            return this.returnSongData(id, retryCount + 1); // Recursive call with incremented retryCount
          } else {
            this.sendError(`Reached maximum retry attempts for next command.`);
            return false;
          }
        }
      }
    } catch (error) {
      this.sendError(`Error executing next command: ${error}`);
      return false;
    }
  }

  async getInfo() {
    const result = await this.executeCommand('get');
    if (result === false) {
      this.sendError('Music Data returned false! There was an error');
      return false;
    } else {
      const musicData = {
        album: result?.album ?? null,
        artist: result?.artist ?? null,
        playlist: null,
        playlist_id: null,
        track_name: result?.title ?? '',
        shuffle_state: result?.shuffleMode,
        repeat_state: result?.repeatMode,
        is_playing: result?.isPlaying ?? result?.playbackRate > 0,
        can_fast_forward: true,
        can_skip: true,
        can_like: false,
        can_change_volume: result?.volume !== null,
        can_set_output: result?.deviceID !== null,
        track_duraion: result?.duration ? parseInt(result?.duration) : null,
        track_progress: result?.elapsedTime ? parseInt(result?.elapsedTime) : null,
        volume: result?.volume ? parseInt(result?.volume * 100) : null,
        thumbnail: result?.artworkData ? "data:" + (result?.artworkMIMEType ?? 'image/png') + ";base64," + result?.artworkData : 'N/A',
        device: result?.deviceName ?? '',
        id: result?.contentItemIdentifier ?? '',
        device_id: result?.deviceID.toString() ?? '',
      }
      return musicData;
    }
  }

  async executeCommand(command, args = '') {
    return new Promise((resolve, reject) => {
      exec(`"${__dirname}/media-cli" ${command} ${args}`, (error, stdout, stderr) => {
        if (error) {
          this.sendError(`exec error: ${error}`);
          reject(false);
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (!result?.success) {
            this.sendError('Error executing command:' + result?.msg);
            reject(false);
            return;
          }
          resolve(result?.data ?? true);
        } catch (parseError) {
          this.sendError('Error parsing JSON:' + parseError);
          reject(false);
        }
      });
    });
  }

  async next(id) {
    const result = await this.executeCommand('next');
    if (result) {
      return await this.returnSongData(id)
    }
    return false
  }

  async previous() {
    return this.executeCommand('previous');
  }

  async skip(seconds) {
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

  async seek(positionMs) {
    return this.executeCommand('seek', positionMs);
  }

  async volume(volume) {
    volume = volume / 100;
    return this.executeCommand('volume', volume);
  }
}

export default MediaMac
