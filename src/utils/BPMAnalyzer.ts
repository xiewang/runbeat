import { Audio } from 'expo-av';

/**
 * BPM 分析器 - 使用能量峰值检测算法
 */
export class BPMAnalyzer {
  private audioContext: AudioContext | null = null;

  /**
   * 分析音频文件的 BPM
   */
  async analyzeBPM(uri: string): Promise<number> {
    try {
      // 加载音频文件
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      
      // 创建 AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // 提取音频数据（合并左右声道）
      const channelData = this.mergeChannels(audioBuffer);
      
      // 计算 BPM
      const bpm = this.detectBPM(channelData, audioBuffer.sampleRate);
      
      return Math.round(bpm);
    } catch (error) {
      console.error('BPM 分析失败:', error);
      return 120; // 默认返回 120 BPM
    }
  }

  /**
   * 合并多声道为单声道
   */
  private mergeChannels(audioBuffer: AudioBuffer): Float32Array {
    const numChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const merged = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        sum += audioBuffer.getChannelData(ch)[i];
      }
      merged[i] = sum / numChannels;
    }
    
    return merged;
  }

  /**
   * 检测 BPM - 使用能量峰值算法
   */
  private detectBPM(audioData: Float32Array, sampleRate: number): number {
    // 降采样以提高性能
    const downsampleRate = 1000; // 1kHz 足够用于节奏检测
    const downsampleFactor = Math.floor(sampleRate / downsampleRate);
    const downsampledLength = Math.floor(audioData.length / downsampleFactor);
    const downsampled = new Float32Array(downsampledLength);
    
    for (let i = 0; i < downsampledLength; i++) {
      let sum = 0;
      for (let j = 0; j < downsampleFactor; j++) {
        sum += Math.abs(audioData[i * downsampleFactor + j]);
      }
      downsampled[i] = sum / downsampleFactor;
    }

    // 计算能量包络
    const windowSize = Math.floor(downsampleRate * 0.1); // 100ms 窗口
    const envelope: number[] = [];
    
    for (let i = 0; i < downsampled.length - windowSize; i += windowSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += downsampled[i + j] * downsampled[i + j];
      }
      envelope.push(Math.sqrt(energy / windowSize));
    }

    // 找到峰值（节拍点）
    const peaks = this.findPeaks(envelope);
    
    // 计算峰值间隔的 BPM
    if (peaks.length < 2) return 120;
    
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    // 使用中位数计算 BPM
    intervals.sort((a, b) => a - b);
    const medianInterval = intervals[Math.floor(intervals.length / 2)];
    
    // 转换为 BPM (interval 是 100ms 窗口的数量)
    const bpm = 60 / (medianInterval * 0.1);
    
    // 限制在合理范围内
    return Math.max(60, Math.min(200, bpm));
  }

  /**
   * 找到能量包络的峰值
   */
  private findPeaks(envelope: number[]): number[] {
    const peaks: number[] = [];
    const threshold = this.getAverage(envelope) * 1.5;
    const minDistance = 3; // 最小峰值间隔 (300ms)
    
    let lastPeak = -minDistance;
    
    for (let i = 1; i < envelope.length - 1; i++) {
      if (envelope[i] > threshold && 
          envelope[i] > envelope[i - 1] && 
          envelope[i] > envelope[i + 1] &&
          i - lastPeak >= minDistance) {
        peaks.push(i);
        lastPeak = i;
      }
    }
    
    return peaks;
  }

  /**
   * 计算平均值
   */
  private getAverage(arr: number[]): number {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  /**
   * 释放资源
   */
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// 导出单例
export const bpmAnalyzer = new BPMAnalyzer();
