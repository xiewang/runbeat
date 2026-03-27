import { Accelerometer } from 'expo-sensors';

/**
 * 步频检测器 - 使用加速度传感器
 */
export class CadenceDetector {
  private subscription: { remove: () => void } | null = null;
  private stepTimestamps: number[] = [];
  private lastStepTime: number = 0;
  private stepCount: number = 0;
  private readonly STEP_THRESHOLD = 1.2; // 步进阈值
  private readonly MIN_STEP_INTERVAL = 250; // 最小步间隔 (ms)
  private readonly WINDOW_SIZE = 5000; // 计算窗口 (5秒)
  
  private onCadenceChange: ((cadence: number) => void) | null = null;

  /**
   * 开始检测步频
   */
  async start(callback: (cadence: number) => void): Promise<void> {
    this.onCadenceChange = callback;
    this.stepTimestamps = [];
    this.stepCount = 0;
    
    // 请求权限
    const { status } = await Accelerometer.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('需要加速度传感器权限');
    }
    
    // 设置更新频率 (20Hz)
    Accelerometer.setUpdateInterval(50);
    
    // 订阅传感器数据
    this.subscription = Accelerometer.addListener(this.handleAccelerometerData);
  }

  /**
   * 停止检测
   */
  stop(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.onCadenceChange = null;
  }

  /**
   * 处理加速度数据
   */
  private handleAccelerometerData = ({ x, y, z }: { x: number; y: number; z: number }) => {
    const now = Date.now();
    
    // 计算合加速度
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    
    // 检测步进 (简单的峰值检测)
    if (magnitude > this.STEP_THRESHOLD && 
        now - this.lastStepTime > this.MIN_STEP_INTERVAL) {
      this.stepTimestamps.push(now);
      this.lastStepTime = now;
      this.stepCount++;
      
      // 清理旧数据
      this.cleanupOldData(now);
      
      // 计算当前步频
      const cadence = this.calculateCadence();
      
      if (this.onCadenceChange) {
        this.onCadenceChange(cadence);
      }
    }
  };

  /**
   * 清理过期数据
   */
  private cleanupOldData(now: number): void {
    const cutoff = now - this.WINDOW_SIZE;
    this.stepTimestamps = this.stepTimestamps.filter(t => t > cutoff);
  }

  /**
   * 计算当前步频 (步/分钟)
   */
  private calculateCadence(): number {
    if (this.stepTimestamps.length < 2) return 0;
    
    const windowDuration = this.WINDOW_SIZE / 1000; // 秒
    const stepsInWindow = this.stepTimestamps.length;
    
    // 计算 BPM (步/分钟)
    const cadence = (stepsInWindow / windowDuration) * 60;
    
    // 限制在合理范围
    return Math.round(Math.max(0, Math.min(220, cadence)));
  }

  /**
   * 获取总步数
   */
  getStepCount(): number {
    return this.stepCount;
  }

  /**
   * 重置计数
   */
  reset(): void {
    this.stepCount = 0;
    this.stepTimestamps = [];
    this.lastStepTime = 0;
  }
}

// 导出单例
export const cadenceDetector = new CadenceDetector();
