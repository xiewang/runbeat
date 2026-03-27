import { Audio, AVPlaybackStatus } from 'expo-av';
import { MusicTrack } from './MusicLibrary';
import { beatGenerator } from './BeatGenerator';

/**
 * 音乐播放器 - 管理音乐播放和节拍叠加
 */
export class MusicPlayer {
  private sound: Audio.Sound | null = null;
  private currentTrack: MusicTrack | null = null;
  private isPlaying: boolean = false;
  private targetBPM: number = 120;
  private beatMixEnabled: boolean = true;
  private volume: number = 1.0;

  // 回调函数
  private onTrackChange: ((track: MusicTrack | null) => void) | null = null;
  private onPlaybackStatusChange: ((status: AVPlaybackStatus) => void) | null = null;

  constructor() {
    // 设置音频模式
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
  }

  /**
   * 加载并播放音乐
   */
  async playTrack(track: MusicTrack): Promise<void> {
    // 停止当前播放
    await this.stop();

    this.currentTrack = track;

    try {
      // 创建新的音频对象
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { 
          shouldPlay: true,
          volume: this.volume,
          progressUpdateIntervalMillis: 1000,
        },
        this.handlePlaybackStatusUpdate
      );

      this.sound = sound;
      this.isPlaying = true;

      // 如果启用节拍叠加，启动节拍生成器
      if (this.beatMixEnabled) {
        this.syncBeatGenerator();
      }

      if (this.onTrackChange) {
        this.onTrackChange(track);
      }
    } catch (error) {
      console.error('播放失败:', error);
      throw error;
    }
  }

  /**
   * 暂停/恢复播放
   */
  async togglePlayback(): Promise<void> {
    if (!this.sound) return;

    if (this.isPlaying) {
      await this.sound.pauseAsync();
      beatGenerator.stop();
      this.isPlaying = false;
    } else {
      await this.sound.playAsync();
      if (this.beatMixEnabled) {
        beatGenerator.start();
      }
      this.isPlaying = true;
    }
  }

  /**
   * 停止播放
   */
  async stop(): Promise<void> {
    beatGenerator.stop();
    
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
    
    this.isPlaying = false;
    this.currentTrack = null;
  }

  /**
   * 设置音量
   */
  async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.sound) {
      await this.sound.setVolumeAsync(this.volume);
    }
  }

  /**
   * 设置目标 BPM（用于节拍同步）
   */
  setTargetBPM(bpm: number): void {
    this.targetBPM = Math.max(60, Math.min(200, bpm));
    
    // 同步节拍生成器
    if (this.beatMixEnabled && this.isPlaying) {
      this.syncBeatGenerator();
    }
  }

  /**
   * 启用/禁用节拍叠加
   */
  setBeatMixEnabled(enabled: boolean): void {
    this.beatMixEnabled = enabled;
    
    if (this.isPlaying) {
      if (enabled) {
        this.syncBeatGenerator();
      } else {
        beatGenerator.stop();
      }
    }
  }

  /**
   * 同步节拍生成器
   */
  private syncBeatGenerator(): void {
    if (!this.currentTrack) return;

    // 计算音乐 BPM 与目标步频的差异
    const trackBPM = this.currentTrack.bpm || 120;
    const bpmDiff = this.targetBPM - trackBPM;

    // 如果差异较大，使用节拍生成器补充节奏
    if (Math.abs(bpmDiff) > 5) {
      // 使用目标 BPM 作为节拍器速度
      beatGenerator.setTempo(this.targetBPM);
      beatGenerator.setVolume(0.3); // 较低的音量叠加
      
      if (this.isPlaying) {
        beatGenerator.start();
      }
    } else {
      // BPM 接近，不需要额外节拍
      beatGenerator.stop();
    }
  }

  /**
   * 处理播放状态更新
   */
  private handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (this.onPlaybackStatusChange) {
      this.onPlaybackStatusChange(status);
    }

    // 检测播放结束
    if (status.isLoaded && status.didJustFinish) {
      this.handleTrackFinished();
    }
  };

  /**
   * 曲目播放完毕
   */
  private handleTrackFinished(): void {
    // 可以在这里实现自动播放下一首
    this.isPlaying = false;
    beatGenerator.stop();
  }

  /**
   * 获取当前播放位置
   */
  async getPosition(): Promise<number> {
    if (!this.sound) return 0;
    const status = await this.sound.getStatusAsync();
    return status.isLoaded ? status.positionMillis : 0;
  }

  /**
   * 跳转到指定位置
   */
  async seekTo(position: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(position);
    }
  }

  /**
   * 获取当前曲目
   */
  getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }

  /**
   * 是否正在播放
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * 设置曲目变化回调
   */
  setOnTrackChange(callback: (track: MusicTrack | null) => void): void {
    this.onTrackChange = callback;
  }

  /**
   * 设置播放状态回调
   */
  setOnPlaybackStatusChange(callback: (status: AVPlaybackStatus) => void): void {
    this.onPlaybackStatusChange = callback;
  }

  /**
   * 释放资源
   */
  async dispose(): Promise<void> {
    await this.stop();
    beatGenerator.dispose();
  }
}

// 导出单例
export const musicPlayer = new MusicPlayer();
