import * as MediaLibrary from 'expo-media-library';
import { bpmAnalyzer } from './BPMAnalyzer';

/**
 * 音乐轨道类型
 */
export interface MusicTrack {
  id: string;
  uri: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  album?: string;
}

/**
 * 音乐库管理器
 */
export class MusicLibrary {
  private tracks: MusicTrack[] = [];
  private analyzedTracks: Map<string, number> = new Map(); // 缓存已分析的 BPM

  /**
   * 请求权限并加载本地音乐
   */
  async loadLocalMusic(): Promise<MusicTrack[]> {
    // 请求权限
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('需要访问媒体库的权限');
    }

    // 获取音频文件
    const media = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: 1000,
    });

    // 转换为轨道格式
    const tracks: MusicTrack[] = media.assets.map(asset => ({
      id: asset.id,
      uri: asset.uri,
      title: asset.filename.replace(/\.[^/.]+$/, ''), // 移除扩展名
      artist: '未知艺术家',
      duration: asset.duration * 1000, // 转换为毫秒
      bpm: 0, // 待分析
    }));

    this.tracks = tracks;
    return tracks;
  }

  /**
   * 分析所有音乐的 BPM
   */
  async analyzeAllBPM(onProgress?: (current: number, total: number) => void): Promise<void> {
    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      
      // 检查缓存
      if (this.analyzedTracks.has(track.id)) {
        track.bpm = this.analyzedTracks.get(track.id)!;
      } else {
        // 分析 BPM
        try {
          const bpm = await bpmAnalyzer.analyzeBPM(track.uri);
          track.bpm = bpm;
          this.analyzedTracks.set(track.id, bpm);
        } catch (error) {
          console.warn(`分析失败: ${track.title}`, error);
          track.bpm = 120; // 默认值
        }
      }
      
      if (onProgress) {
        onProgress(i + 1, this.tracks.length);
      }
    }
  }

  /**
   * 根据目标 BPM 选择最接近的音乐
   */
  findBestMatch(targetBPM: number, excludeId?: string): MusicTrack | null {
    const availableTracks = excludeId 
      ? this.tracks.filter(t => t.id !== excludeId && t.bpm > 0)
      : this.tracks.filter(t => t.bpm > 0);

    if (availableTracks.length === 0) return null;

    // 找到最接近目标 BPM 的曲目
    let bestMatch = availableTracks[0];
    let minDiff = Math.abs(availableTracks[0].bpm - targetBPM);

    for (const track of availableTracks) {
      const diff = Math.abs(track.bpm - targetBPM);
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = track;
      }
    }

    return bestMatch;
  }

  /**
   * 获取 BPM 范围内的音乐
   */
  getTracksInRange(minBPM: number, maxBPM: number): MusicTrack[] {
    return this.tracks.filter(t => t.bpm >= minBPM && t.bpm <= maxBPM);
  }

  /**
   * 获取所有音乐
   */
  getAllTracks(): MusicTrack[] {
    return [...this.tracks];
  }

  /**
   * 按 BPM 排序
   */
  getTracksSortedByBPM(): MusicTrack[] {
    return [...this.tracks].sort((a, b) => a.bpm - b.bpm);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.analyzedTracks.clear();
  }
}

// 导出单例
export const musicLibrary = new MusicLibrary();
