export class AudioService {
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;
  private isAnalyzing: boolean = false;
  private smoothedLevel: number = 0;
  private lastActiveTime: number = 0;
  private readonly cooldownPeriod: number = 1000;
  private noiseFloor: number = 0;
  private noiseCalibrationFrames: number = 0;
  private readonly NOISE_CALIBRATION_DURATION = 30;
  private readonly NOISE_MARGIN = 1.2;
  private readonly ACTIVATION_THRESHOLD = 0.25;
  private readonly DEACTIVATION_THRESHOLD = 0.15;

  async setupAudioAnalysis(
    stream: MediaStream,
    onAudioLevel: (level: number) => void
  ): Promise<void> {
    try {
      await this.cleanup();

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack || audioTrack.muted || !audioTrack.enabled) {
        onAudioLevel(0);
        return;
      }

      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioAnalyser = this.audioContext.createAnalyser();

      this.configureAnalyser();
      source.connect(this.audioAnalyser);

      this.audioDataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
      this.resetNoiseCalibration();

      this.isAnalyzing = true;
      this.analyzeAudio(onAudioLevel);
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
      await this.cleanup();
      throw error;
    }
  }

  private configureAnalyser(): void {
    if (!this.audioAnalyser) return;
    this.audioAnalyser.fftSize = 2048;
    this.audioAnalyser.smoothingTimeConstant = 0.8;
    this.audioAnalyser.minDecibels = -90;
    this.audioAnalyser.maxDecibels = -30;
  }

  private resetNoiseCalibration(): void {
    this.noiseFloor = 0;
    this.noiseCalibrationFrames = 0;
  }

  private analyzeAudio(onAudioLevel: (level: number) => void): void {
    if (!this.isAnalyzing || !this.audioAnalyser || !this.audioDataArray) return;

    const startBin = Math.floor((85 * this.audioAnalyser.fftSize) / (this.audioContext?.sampleRate || 44100));
    const endBin = Math.floor((255 * this.audioAnalyser.fftSize) / (this.audioContext?.sampleRate || 44100));

    const analyze = () => {
      if (!this.audioAnalyser || !this.audioDataArray || !this.isAnalyzing) return;

      this.audioAnalyser.getByteFrequencyData(this.audioDataArray);

      const currentLevel = this.calculateFrequencyLevel(startBin, endBin);
      const adjustedLevel = this.applyNoiseReduction(currentLevel);

      const now = Date.now();
      this.updateSmoothedLevel(adjustedLevel, now);
      const finalLevel = this.determineFinalLevel(now);

      onAudioLevel(finalLevel);
      this.animationFrameId = requestAnimationFrame(() => analyze());
    };

    analyze();
  }

  private calculateFrequencyLevel(startBin: number, endBin: number): number {
    let sum = 0;
    let count = 0;
    for (let i = startBin; i < endBin; i++) {
      sum += this.audioDataArray![i];
      count++;
    }
    return sum / (count * 255);
  }

  private applyNoiseReduction(currentLevel: number): number {
    if (this.noiseCalibrationFrames < this.NOISE_CALIBRATION_DURATION) {
      this.noiseFloor = Math.max(this.noiseFloor, currentLevel);
      this.noiseCalibrationFrames++;
      return 0;
    }
    return Math.max(0, currentLevel - this.noiseFloor * this.NOISE_MARGIN);
  }

  private updateSmoothedLevel(adjustedLevel: number, now: number): void {
    const timeSinceLastActive = now - this.lastActiveTime;
    const smoothingFactor = timeSinceLastActive < this.cooldownPeriod ? 0.05 : 0.2;
    this.smoothedLevel = this.smoothedLevel * (1 - smoothingFactor) + adjustedLevel * smoothingFactor;
  }

  private determineFinalLevel(now: number): number {
    if (this.smoothedLevel > this.ACTIVATION_THRESHOLD) {
      this.lastActiveTime = now;
      return 1;
    }
    return this.smoothedLevel > this.DEACTIVATION_THRESHOLD && (now - this.lastActiveTime < this.cooldownPeriod)
      ? 1
      : 0;
  }

  async cleanup(): Promise<void> {
    this.isAnalyzing = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.audioAnalyser) {
      this.audioAnalyser.disconnect();
      this.audioAnalyser = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.warn('Error closing audio context:', error);
      }
    }
    this.audioContext = null;

    this.audioDataArray = null;
    this.smoothedLevel = 0;
    this.lastActiveTime = 0;
    this.resetNoiseCalibration();
  }
}