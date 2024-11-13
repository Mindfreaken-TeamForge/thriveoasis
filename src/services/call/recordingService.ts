export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStream: MediaStream | null = null;
  private isRecording: boolean = false;

  private selectMimeType(): string {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    return mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';
  }

  async startRecording(stream?: MediaStream): Promise<void> {
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        console.error('Failed to get user media:', error);
        throw error;
      }
    }

    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) throw new Error('No audio track found in stream');

      this.recordingStream = new MediaStream([audioTrack]);
      this.recordedChunks = [];

      const selectedMimeType = this.selectMimeType();
      if (!selectedMimeType) throw new Error('No supported MIME type found for audio recording');
      
      this.mediaRecorder = new MediaRecorder(this.recordingStream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000,
      });
      this.mediaRecorder.ondataavailable = this.handleDataAvailable.bind(this);
      this.mediaRecorder.onerror = this.handleError.bind(this);

      this.mediaRecorder.start(1000);
      this.isRecording = true;

      console.log('Recording started with MIME type:', selectedMimeType);

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.isRecording = false;
      throw error;
    }
  }

  private handleDataAvailable(event: BlobEvent): void {
    if (event.data.size > 0) this.recordedChunks.push(event.data);
  }

  private handleError(error: Event): void {
    console.error('MediaRecorder error:', error);
    this.isRecording = false;
  }

  async stopRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder || !this.isRecording) {
      console.warn('No active recording to stop');
      return null;
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder!.addEventListener('stop', () => {
        const finalBlob = this.createBlob();
        if (finalBlob && finalBlob.size > 0) {
          console.log('Recording blob created successfully:', finalBlob.size);
          resolve(finalBlob);
        } else {
          console.error('Recording blob is empty or null');
          reject(new Error("Recording blob is empty or null"));
        }
      });

      this.mediaRecorder!.stop();
      this.isRecording = false;
      console.log('Stop command sent to MediaRecorder');
    });
  }

  private createBlob(): Blob | null {
    if (!this.recordedChunks.length) {
      console.warn('No recorded data available');
      return null;
    }

    const finalBlob = new Blob(this.recordedChunks, {
      type: this.mediaRecorder?.mimeType || 'audio/webm;codecs=opus',
    });

    if (finalBlob.size === 0) {
      console.error('Created blob is empty');
      return null;
    }

    console.log('Recording completed:', {
      size: finalBlob.size,
      type: finalBlob.type,
      timestamp: new Date().toISOString(),
    });

    this.recordedChunks = [];
    return finalBlob;
  }

  cleanup(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }

    if (this.recordingStream) {
      this.recordingStream.getTracks().forEach((track) => {
        track.stop();
        console.log('Track stopped:', track);
      });
    }

    this.mediaRecorder = null;
    this.recordingStream = null;
    this.recordedChunks = [];
    this.isRecording = false;
    console.log('Recording cleanup completed');
  }
}