class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.audioElement = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.currentTime = 0;
        this.seekTime = 0;
        this.frequencyData = null;
        this.timeDomainData = null;
        
        // Frequency bands (based on 44.1kHz sample rate, 256 FFT size)
        // Each bin = ~344Hz (44100/128)
        // Bass: 20Hz - 300Hz (bins 0-1)
        // Mid: 300Hz - 3kHz (bins 2-8) 
        // Treble: 3kHz - 22kHz (bins 9-127)
        this.bassRange = { start: 0, end: 2 };
        this.midRange = { start: 2, end: 9 };
        this.trebleRange = { start: 9, end: 128 };
        
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Web Audio API not supported:', error);
        }
    }

    async loadAudio(file) {
        return new Promise((resolve, reject) => {
            if (!this.audioContext) {
                reject(new Error('Audio context not initialized'));
                return;
            }

            const fileReader = new FileReader();
            fileReader.onload = (e) => {
                const arrayBuffer = e.target.result;
                this.audioContext.decodeAudioData(arrayBuffer)
                    .then((audioBuffer) => {
                        this.audioBuffer = audioBuffer;
                        this.setupAnalyser();
                        resolve(audioBuffer);
                    })
                    .catch(reject);
            };
            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(file);
        });
    }

    setupAnalyser() {
        if (!this.audioContext || !this.audioBuffer) return;

        // Create audio source
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.audioBuffer;

        // Create gain node for volume control
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0.7; // Default volume

        // Create analyser node
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;

        // Connect audio graph: source -> gain -> analyser -> destination
        this.source.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        // Create data arrays
        const bufferLength = this.analyser.frequencyBinCount;
        this.frequencyData = new Uint8Array(bufferLength);
        this.timeDomainData = new Uint8Array(bufferLength);
    }

    play() {
        if (!this.audioBuffer || this.isPlaying) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // Calculate offset for resume or seek
            const offset = this.isPaused ? this.pauseTime : this.seekTime;
            
            // If we're resuming from pause or seeking, create a new source
            if (this.isPaused || this.seekTime > 0) {
                this.setupAnalyser();
                this.isPaused = false;
            }
            
            this.source.start(0, offset);
            this.isPlaying = true;
            this.startTime = this.audioContext.currentTime - offset;
            this.seekTime = 0; // Reset seek time after starting
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    stop() {
        if (!this.source || (!this.isPlaying && !this.isPaused)) return;

        try {
            if (this.isPlaying) {
                this.source.stop();
            }
            this.isPlaying = false;
            this.isPaused = false;
            this.pauseTime = 0;
            this.seekTime = 0;
            this.currentTime = 0;
            this.setupAnalyser(); // Reset for next play
        } catch (error) {
            console.error('Error stopping audio:', error);
        }
    }

    pause() {
        if (!this.isPlaying || this.isPaused) return;

        try {
            this.source.stop();
            this.pauseTime = this.audioContext.currentTime - this.startTime;
            this.currentTime = this.pauseTime;
            this.isPlaying = false;
            this.isPaused = true;
        } catch (error) {
            console.error('Error pausing audio:', error);
        }
    }

    setVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.value = volume / 100;
        }
    }

    getFrequencyData() {
        if (!this.analyser) return null;
        
        this.analyser.getByteFrequencyData(this.frequencyData);
        return this.frequencyData;
    }

    getTimeDomainData() {
        if (!this.analyser) return null;
        
        this.analyser.getByteTimeDomainData(this.timeDomainData);
        return this.timeDomainData;
    }

    getFrequencyBands() {
        const frequencyData = this.getFrequencyData();
        if (!frequencyData) return { bass: 0, mid: 0, treble: 0 };

        const bass = this.getAverageFrequency(frequencyData, this.bassRange);
        const mid = this.getAverageFrequency(frequencyData, this.midRange);
        const treble = this.getAverageFrequency(frequencyData, this.trebleRange);

        return { bass, mid, treble };
    }

    getAverageFrequency(data, range) {
        let sum = 0;
        for (let i = range.start; i < range.end && i < data.length; i++) {
            sum += data[i];
        }
        return (sum / (range.end - range.start)) / 255 * 100;
    }

    getRMS() {
        const timeDomainData = this.getTimeDomainData();
        if (!timeDomainData) return 0;

        let sum = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
            const normalized = (timeDomainData[i] - 128) / 128;
            sum += normalized * normalized;
        }
        return Math.sqrt(sum / timeDomainData.length);
    }

    getPeakFrequency() {
        const frequencyData = this.getFrequencyData();
        if (!frequencyData) return 0;

        let maxValue = 0;
        let maxIndex = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            if (frequencyData[i] > maxValue) {
                maxValue = frequencyData[i];
                maxIndex = i;
            }
        }
        return maxIndex;
    }

    getDuration() {
        return this.audioBuffer ? this.audioBuffer.duration : 0;
    }

    getCurrentTime() {
        if (this.isPlaying) {
            return this.audioContext.currentTime - this.startTime;
        } else if (this.isPaused) {
            return this.pauseTime;
        }
        return this.currentTime;
    }

    seekTo(timeInSeconds) {
        if (!this.audioBuffer) return;
        
        // Clamp to valid range
        const duration = this.audioBuffer.duration;
        timeInSeconds = Math.max(0, Math.min(timeInSeconds, duration));
        
        this.seekTime = timeInSeconds;
        this.currentTime = timeInSeconds;
        
        // If currently playing, restart from new position
        if (this.isPlaying) {
            this.source.stop();
            this.setupAnalyser();
            this.source.start(0, timeInSeconds);
            this.startTime = this.audioContext.currentTime - timeInSeconds;
        } else if (this.isPaused) {
            this.pauseTime = timeInSeconds;
        }
    }

    getProgress() {
        if (!this.audioBuffer) return 0;
        const duration = this.audioBuffer.duration;
        const current = this.getCurrentTime();
        return duration > 0 ? current / duration : 0;
    }

    isAudioLoaded() {
        return this.audioBuffer !== null;
    }

    getBufferLength() {
        return this.analyser ? this.analyser.frequencyBinCount : 0;
    }

    getFrequencyRanges() {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const binCount = this.getBufferLength();
        const binSize = sampleRate / (binCount * 2);
        
        return {
            sampleRate,
            binCount,
            binSize,
            bass: {
                start: this.bassRange.start * binSize,
                end: this.bassRange.end * binSize
            },
            mid: {
                start: this.midRange.start * binSize,
                end: this.midRange.end * binSize
            },
            treble: {
                start: this.trebleRange.start * binSize,
                end: this.trebleRange.end * binSize
            }
        };
    }
}
