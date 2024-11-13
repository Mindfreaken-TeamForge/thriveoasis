export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;

  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.google.com:19302' },
      { urls: 'stun:stun2.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    enableDscp: true,
    iceTransportPolicy: 'all',
  };

  private readonly audioConstraints: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
    sampleRate: 48000,
    sampleSize: 16,
  };

  private readonly MAX_BITRATE = 128000; // 128 kbps for audio
  private readonly STATS_INTERVAL = 3000; // Interval in ms for stats monitoring
  private statsIntervalId: number | null = null;

  async initialize(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: this.audioConstraints,
        video: false,
      });

      this.peerConnection = new RTCPeerConnection(this.rtcConfig);
      this.addLocalTracks();
      this.setupConnectionMonitoring();
      this.setupDataChannel();

      return this.localStream;
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      await this.cleanup();
      throw error;
    }
  }

  private addLocalTracks(): void {
    if (!this.localStream || !this.peerConnection) return;

    this.localStream.getTracks().forEach((track) => {
      const sender = this.peerConnection!.addTrack(track, this.localStream!);
      if (track.kind === 'audio') {
        const params = sender.getParameters();
        if (!params.encodings) params.encodings = [{}];
        params.encodings[0].maxBitrate = this.MAX_BITRATE;
        sender.setParameters(params).catch(console.error);
      }
    });
  }

  private setupConnectionMonitoring(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection?.iceConnectionState);
    };

    this.peerConnection.onsignalingstatechange = () => {
      console.log('Signaling state:', this.peerConnection?.signalingState);
    };

    this.startStatsMonitoring();
  }

  private startStatsMonitoring(): void {
    if (!this.peerConnection) return;

    this.statsIntervalId = setInterval(() => {
      this.peerConnection!.getStats().then((stats) => {
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            console.debug('Audio stats:', {
              packetsLost: report.packetsLost,
              jitter: report.jitter,
              roundTripTime: report.roundTripTime,
            });
          }
        });
      });
    }, this.STATS_INTERVAL);
  }

  private setupDataChannel(): void {
    if (!this.peerConnection) return;

    const dataChannel = this.peerConnection.createDataChannel('adminChat', {
      ordered: true,
      maxRetransmits: 3,
      maxPacketLifeTime: 3000,
    });

    dataChannel.onopen = () => {
      console.log('Data channel opened');
    };

    dataChannel.onclose = () => {
      console.log('Data channel closed');
    };
  }

  async cleanup(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.getDataChannels().forEach((channel) => channel.close());
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.statsIntervalId) {
      clearInterval(this.statsIntervalId);
      this.statsIntervalId = null;
    }
  }

  async getConnectionStats(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) return null;
    return await this.peerConnection.getStats();
  }

  isConnectionStable(): boolean {
    return (
      this.peerConnection?.connectionState === 'connected' &&
      this.peerConnection?.iceConnectionState === 'connected' &&
      this.peerConnection?.signalingState === 'stable'
    );
  }
}
