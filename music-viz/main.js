class MusicVisualizerApp {
    constructor() {
        this.audioAnalyzer = new AudioAnalyzer();
        this.visualizer = null;
        this.isPlaying = false;
        this.isDragging = false;
        
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
        
        // Progress bar elements
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.totalTimeDisplay = document.getElementById('totalTime');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.progressHandle = document.getElementById('progressHandle');
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
        
        // Progress bar events
        this.progressBar.addEventListener('click', (e) => this.handleProgressClick(e));
        this.progressHandle.addEventListener('mousedown', (e) => this.startDragging(e));
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Mouse events for dragging
        document.addEventListener('mousemove', (e) => this.handleDrag(e));
        document.addEventListener('mouseup', (e) => this.stopDragging(e));
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
            
            // Debug: Log frequency ranges
            const ranges = this.audioAnalyzer.getFrequencyRanges();
            if (ranges) {
                console.log('Frequency Analysis Setup:');
                console.log(`Sample Rate: ${ranges.sampleRate}Hz`);
                console.log(`Bin Count: ${ranges.binCount}`);
                console.log(`Bin Size: ${ranges.binSize.toFixed(1)}Hz per bin`);
                console.log(`Bass: ${ranges.bass.start.toFixed(1)}Hz - ${ranges.bass.end.toFixed(1)}Hz`);
                console.log(`Mid: ${ranges.mid.start.toFixed(1)}Hz - ${ranges.mid.end.toFixed(1)}Hz`);
                console.log(`Treble: ${ranges.treble.start.toFixed(1)}Hz - ${ranges.treble.end.toFixed(1)}Hz`);
            }
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
            
            // Update progress display
            this.updateProgressDisplay();
            
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

    handleProgressClick(event) {
        if (!this.audioAnalyzer.isAudioLoaded()) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const progress = clickX / rect.width;
        const duration = this.audioAnalyzer.getDuration();
        const seekTime = progress * duration;
        
        this.audioAnalyzer.seekTo(seekTime);
        this.updateProgressDisplay();
    }

    startDragging(event) {
        if (!this.audioAnalyzer.isAudioLoaded()) return;
        
        event.preventDefault();
        this.isDragging = true;
        this.progressHandle.style.cursor = 'grabbing';
    }

    handleDrag(event) {
        if (!this.isDragging || !this.audioAnalyzer.isAudioLoaded()) return;
        
        event.preventDefault();
        const rect = this.progressBar.getBoundingClientRect();
        const dragX = event.clientX - rect.left;
        const progress = Math.max(0, Math.min(1, dragX / rect.width));
        const duration = this.audioAnalyzer.getDuration();
        const seekTime = progress * duration;
        
        this.audioAnalyzer.seekTo(seekTime);
        this.updateProgressDisplay();
    }

    stopDragging(event) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.progressHandle.style.cursor = 'grab';
    }

    updateProgressDisplay() {
        if (!this.audioAnalyzer.isAudioLoaded()) return;
        
        const currentTime = this.audioAnalyzer.getCurrentTime();
        const duration = this.audioAnalyzer.getDuration();
        const progress = this.audioAnalyzer.getProgress();
        
        // Update time displays
        this.currentTimeDisplay.textContent = this.formatTime(currentTime);
        this.totalTimeDisplay.textContent = this.formatTime(duration);
        
        // Update progress bar
        const progressPercent = progress * 100;
        this.progressFill.style.width = `${progressPercent}%`;
        this.progressHandle.style.left = `${progressPercent}%`;
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
