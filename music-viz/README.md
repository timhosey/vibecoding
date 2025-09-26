# 🎵 VibeCode Music Visualizer

A stunning real-time music visualizer built with HTML5 Canvas and Web Audio API. Experience your music like never before with multiple visualization modes and color schemes.

## ✨ Features

### 🎨 Visualization Modes
- **Frequency Bars**: Classic equalizer-style bars that dance to the beat
- **Particle System**: Dynamic particles that respond to bass, mid, and treble frequencies
- **Wave Form**: Smooth wave patterns that mirror the audio waveform
- **Circular Spectrum**: 360-degree circular frequency visualization
- **Matrix Rain**: Digital rain effect inspired by The Matrix

### 🌈 Color Schemes
- **Rainbow**: Dynamic rainbow colors that shift over time
- **Neon**: Bright neon colors for a cyberpunk vibe
- **Fire**: Warm reds and oranges that flicker like flames
- **Ocean**: Cool blues and teals for a calming experience
- **Monochrome**: Classic black and white aesthetic

### 🎛️ Controls
- **File Upload**: Load any audio file (MP3, WAV, etc.)
- **Play/Pause**: Control playback with button or spacebar
- **Volume Control**: Adjust audio volume with slider or arrow keys
- **Real-time Analysis**: Live frequency band analysis (Bass, Mid, Treble)

### ⌨️ Keyboard Shortcuts
- `Spacebar`: Play/Pause
- `Escape`: Stop
- `↑/↓ Arrow Keys`: Volume up/down

## 🚀 Getting Started

1. Open `index.html` in a modern web browser
2. Click "Choose Music File" to load an audio file
3. Select your preferred visualization mode and color scheme
4. Press play and enjoy the show!

## 🛠️ Technical Details

### Built With
- **HTML5 Canvas**: For high-performance graphics rendering
- **Web Audio API**: For real-time audio analysis
- **Vanilla JavaScript**: No external dependencies
- **CSS3**: Modern styling with gradients and animations

### Browser Compatibility
- Chrome 66+
- Firefox 60+
- Safari 14+
- Edge 79+

### Audio Format Support
- MP3
- WAV
- OGG
- M4A
- Any format supported by the Web Audio API

## 🎯 How It Works

1. **Audio Loading**: Files are loaded using the FileReader API and decoded with Web Audio API
2. **Frequency Analysis**: Real-time FFT analysis extracts frequency data from the audio
3. **Visualization**: Canvas-based rendering creates smooth, responsive visualizations
4. **Performance**: Optimized for 60fps rendering with efficient algorithms

## 🎨 Customization

The visualizer is highly customizable. You can easily:
- Add new visualization modes in `visualizer.js`
- Create new color schemes in the `getColor()` method
- Adjust animation parameters for different effects
- Modify the UI in `index.html` and `style.css`

## 📱 Responsive Design

The visualizer adapts to different screen sizes:
- Desktop: Full-featured experience with all controls
- Tablet: Optimized layout with touch-friendly controls
- Mobile: Streamlined interface for smaller screens

## 🎵 Sample Music

Included with this project is "Dramatic Fanatic.mp3" - a sample track perfect for testing the visualizer's capabilities.

## 🔧 Development

To modify or extend the visualizer:

1. **Add New Visualization Mode**:
   - Add option to HTML select
   - Implement drawing method in `visualizer.js`
   - Add case in the `animate()` method

2. **Add New Color Scheme**:
   - Add option to color mode select
   - Implement color logic in `getColor()` method

3. **Modify Audio Analysis**:
   - Adjust frequency ranges in `audio-analyzer.js`
   - Add new analysis methods as needed

## 🎉 Enjoy the Vibes!

This music visualizer is designed to be both functional and beautiful. Whether you're coding, relaxing, or just want to see your music in a new way, VibeCode Music Visualizer has you covered.

*Made with ❤️ and lots of coffee*
