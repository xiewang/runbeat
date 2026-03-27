import { Audio } from 'expo-av';

/**
 * 节拍生成器 - 使用 Web Audio API 合成节拍
 */
export class BeatGenerator {
  private audioContext: AudioContext | null = null;
  private nextNoteTime: number = 0;
  private tempo: number = 120;
  private isPlaying: boolean = false;
  private lookahead: number = 25; // ms
  private scheduleAheadTime: number = 0.1; // s
  private timerID: number | null = null;
  private current16thNote: number = 0;
  
  // 节拍器音量 (0-1)
  private volume: number = 0.3;

  constructor() {
    this.initAudioContext();
  }

  /**
   * 初始化音频上下文
   */
  private initAudioContext(): void {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * 设置 BPM
   */
  setTempo(bpm: number): void {
    this.tempo = Math.max(60, Math.min(200, bpm));
  }

  /**
   * 设置音量
   */
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * 开始生成节拍
   */
  start(): void {
    if (this.isPlaying) return;
    
    if (!this.audioContext) {
      this.initAudioContext();
    }
    
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.isPlaying = true;
    this.current16thNote = 0;
    this.nextNoteTime = this.audioContext!.currentTime;
    
    this.scheduler();
  }

  /**
   * 停止生成节拍
   */
  stop(): void {
    this.isPlaying = false;
    if (this.timerID !== null) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  /**
   * 调度器 - 安排未来的节拍
   */
  private scheduler(): void {
    if (!this.isPlaying || !this.audioContext) return;
    
    // 安排未来一段时间内的所有节拍
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.nextNote();
    }
    
    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  /**
   * 安排单个节拍
   */
  private scheduleNote(beatNumber: number, time: number): void {
    if (!this.audioContext) return;
    
    // 只在正拍 (0, 4, 8, 12) 播放声音
    if (beatNumber % 4 === 0) {
      this.playClick(time, beatNumber === 0 ? 1000 : 800);
    }
  }

  /**
   * 播打击声
   */
  private playClick(time: number, frequency: number): void {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    osc.frequency.value = frequency;
    osc.type = 'square';
    
    // 包络
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(this.volume, time + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    
    osc.start(time);
    osc.stop(time + 0.05);
  }

  /**
   * 计算下一个节拍时间
   */
  private nextNote(): void {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += 0.25 * secondsPerBeat; // 16分音符
    this.current16thNote++;
    if (this.current16thNote === 16) {
      this.current16thNote = 0;
    }
  }

  /**
   * 是否正在播放
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// 导出单例
export const beatGenerator = new BeatGenerator();
