class MusicVisualizerApp {
    constructor() {
        this.audioAnalyzer = new AudioAnalyzer();
        this.visualizer = null;
        this.isPlaying = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeVisualizer();
    }

    initializeElements() {
        this.fileInput = document.getElementById('audioFile');
        this.playPauseBtn = document.getElementById('playPause');
        this.stopBtn = document.getElementById('stop');
        this.volumeSlider = document.getElementById('volume');
        this.vizModeSelect = document.getElementById('vizMode');
        this.colorModeSelect = document.getElementById('colorMode');
        this.loadingDiv = document.getElementById('loading');
        this.trackName = document.getElementById('trackName');
        this.trackDuration = document.getElementById('trackDuration');
        this.bassLevel = document.getElementById('bassLevel');
        this.midLevel = document.getElementById('midLevel');
        this.trebleLevel = document.getElementById('trebleLevel');
        this.canvas = document.getElementById('visualizer');
    }

    initializeVisualizer() {
        this.visualizer = new MusicVisualizer(this.canvas, this.audioAnalyzer);
        this.visualizer.start();
    }

    setupEventListeners() {
        // File input
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Play/Pause button
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
        // Stop button
        this.stopBtn.addEventListener('click', () => this.stop());
        
        // Volume control
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        
        // Visualization mode change
        this.vizModeSelect.addEventListener('change', () => this.updateVisualizationMode());
        
        // Color mode change
        this.colorModeSelect.addEventListener('change', () => this.updateColorMode());
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showLoading(true);
        this.trackName.textContent = file.name;
        
        try {
            await this.audioAnalyzer.loadAudio(file);
            this.trackDuration.textContent = `Duration: ${this.formatTime(this.audioAnalyzer.getDuration())}`;
            this.updatePlayPauseButton(false);
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading audio:', error);
            alert('Error loading audio file. Please try a different file.');
            this.showLoading(false);
        }
    }

    togglePlayPause() {
        if (!this.audioAnalyzer.isAudioLoaded()) {
            alert('Please load an audio file first.');
            return;
        }

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.audioAnalyzer.play();
        this.isPlaying = true;
        this.updatePlayPauseButton(true);
        this.startAudioInfoUpdate();
    }

    pause() {
        this.audioAnalyzer.pause();
        this.isPlaying = false;
        this.updatePlayPauseButton(false);
    }

    stop() {
        this.audioAnalyzer.stop();
        this.isPlaying = false;
        this.updatePlayPauseButton(false);
    }

    setVolume(volume) {
        this.audioAnalyzer.setVolume(volume);
    }

    updatePlayPauseButton(playing) {
        this.playPauseBtn.textContent = playing ? '⏸️ Pause' : '▶️ Play';
    }

    updateVisualizationMode() {
        // The visualizer will automatically pick up the new mode in the next animation frame
    }

    updateColorMode() {
        // The visualizer will automatically pick up the new color mode in the next animation frame
    }

    startAudioInfoUpdate() {
        const updateInfo = () => {
            if (!this.isPlaying) return;
            
            const bands = this.audioAnalyzer.getFrequencyBands();
            this.bassLevel.textContent = Math.round(bands.bass);
            this.midLevel.textContent = Math.round(bands.mid);
            this.trebleLevel.textContent = Math.round(bands.treble);
            
            requestAnimationFrame(updateInfo);
        };
        updateInfo();
    }

    handleResize() {
        if (this.visualizer) {
            this.visualizer.resize();
        }
    }

    handleKeyboard(event) {
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'Escape':
                this.stop();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.volumeSlider.value = Math.min(100, parseInt(this.volumeSlider.value) + 5);
                this.setVolume(this.volumeSlider.value);
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.volumeSlider.value = Math.max(0, parseInt(this.volumeSlider.value) - 5);
                this.setVolume(this.volumeSlider.value);
                break;
        }
    }

    showLoading(show) {
        this.loadingDiv.classList.toggle('show', show);
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '--:--';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MusicVisualizerApp();
});

// Handle page visibility changes to pause/resume audio
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.musicApp) {
        window.musicApp.pause();
    }
});

// Make the app globally accessible for debugging
window.addEventListener('load', () => {
    window.musicApp = new MusicVisualizerApp();
});
