class MusicVisualizer {
    constructor(canvas, audioAnalyzer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioAnalyzer = audioAnalyzer;
        this.animationId = null;
        this.particles = [];
        this.matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?';
        this.matrixDrops = [];
        
        // 3D Cube properties
        this.cubeRotation = { x: 0, y: 0, z: 0 };
        
        // Kaleidoscope properties
        this.kaleidoscopeSegments = 8;
        this.kaleidoscopePattern = [];
        
        // Water ripples properties
        this.ripples = [];
        this.rippleDamping = 0.98;
        
        // Spectrogram properties
        this.spectrogramData = [];
        this.spectrogramHistory = 100;
        
        this.resizeCanvas();
        this.initMatrix();
        this.initParticles();
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    initMatrix() {
        const fontSize = 14;
        const rect = this.canvas.getBoundingClientRect();
        const columns = Math.floor(rect.width / fontSize);
        for (let i = 0; i < columns; i++) {
            this.matrixDrops[i] = Math.random() * rect.height;
        }
    }

    initParticles() {
        const rect = this.canvas.getBoundingClientRect();
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Math.random() * rect.width,
                y: Math.random() * rect.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    getColor(mode, intensity, index = 0) {
        const alpha = intensity / 100;
        
        switch (mode) {
            case 'rainbow':
                const hue = (index * 360 / 64 + Date.now() * 0.1) % 360;
                return `hsla(${hue}, 100%, 50%, ${alpha})`;
            
            case 'neon':
                const colors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#0080ff'];
                return colors[index % colors.length] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            
            case 'fire':
                const fireIntensity = Math.min(intensity * 1.5, 100);
                return `rgba(${255}, ${fireIntensity * 2.55}, 0, ${alpha})`;
            
            case 'ocean':
                return `rgba(0, ${intensity * 2.55}, 255, ${alpha})`;
            
            case 'monochrome':
                const gray = intensity * 2.55;
                return `rgba(${gray}, ${gray}, ${gray}, ${alpha})`;
            
            default:
                return `rgba(255, 255, 255, ${alpha})`;
        }
    }

    drawFrequencyBars(frequencyData, colorMode) {
        const rect = this.canvas.getBoundingClientRect();
        const barWidth = rect.width / frequencyData.length;
        
        for (let i = 0; i < frequencyData.length; i++) {
            const barHeight = (frequencyData[i] / 255) * rect.height * 0.8;
            const x = i * barWidth;
            const y = rect.height - barHeight;
            
            const color = this.getColor(colorMode, frequencyData[i], i);
            
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, barWidth - 2, barHeight);
            
            // Add glow effect
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(x, y, barWidth - 2, barHeight);
            this.ctx.shadowBlur = 0;
        }
    }

    drawParticleSystem(frequencyData, colorMode) {
        // Update particles based on audio
        const bass = this.audioAnalyzer.getFrequencyBands().bass;
        const mid = this.audioAnalyzer.getFrequencyBands().mid;
        const treble = this.audioAnalyzer.getFrequencyBands().treble;
        
        this.particles.forEach((particle, index) => {
            // Update particle position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            const rect = this.canvas.getBoundingClientRect();
            // Bounce off edges
            if (particle.x < 0 || particle.x > rect.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > rect.height) particle.vy *= -1;
            
            // Keep particles in bounds
            particle.x = Math.max(0, Math.min(rect.width, particle.x));
            particle.y = Math.max(0, Math.min(rect.height, particle.y));
            
            // Update size and opacity based on audio
            const audioIntensity = index < 33 ? bass : index < 66 ? mid : treble;
            particle.size = (audioIntensity / 100) * 5 + 1;
            particle.opacity = Math.min(1, (audioIntensity / 100) * 0.8 + 0.2);
            
            // Draw particle
            const color = this.getColor(colorMode, audioIntensity, index);
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.globalAlpha = 1;
    }

    drawWaveForm(timeDomainData, colorMode) {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.strokeStyle = this.getColor(colorMode, 100);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        const sliceWidth = rect.width / timeDomainData.length;
        let x = 0;
        
        for (let i = 0; i < timeDomainData.length; i++) {
            const v = timeDomainData[i] / 128.0;
            const y = v * rect.height / 2 + rect.height / 2;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.ctx.stroke();
        
        // Add mirror wave
        this.ctx.globalAlpha = 0.3;
        this.ctx.beginPath();
        x = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
            const v = timeDomainData[i] / 128.0;
            const y = rect.height - (v * rect.height / 2 + rect.height / 2);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }

    drawCircularSpectrum(frequencyData, colorMode) {
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        
        this.ctx.translate(centerX, centerY);
        
        for (let i = 0; i < frequencyData.length; i++) {
            const angle = (i / frequencyData.length) * Math.PI * 2;
            const barHeight = (frequencyData[i] / 255) * radius * 0.5;
            
            const x1 = Math.cos(angle) * radius;
            const y1 = Math.sin(angle) * radius;
            const x2 = Math.cos(angle) * (radius + barHeight);
            const y2 = Math.sin(angle) * (radius + barHeight);
            
            const color = this.getColor(colorMode, frequencyData[i], i);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 5;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
        
        this.ctx.shadowBlur = 0;
        this.ctx.translate(-centerX, -centerY);
    }

    drawMatrixRain(frequencyData, colorMode) {
        const rect = this.canvas.getBoundingClientRect();
        const fontSize = 14;
        const columns = Math.floor(rect.width / fontSize);
        
        // Clear with black background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, rect.width, rect.height);
        
        // Update and draw matrix drops
        for (let i = 0; i < columns; i++) {
            const audioIntensity = frequencyData[Math.floor(i * frequencyData.length / columns)] || 0;
            const speed = (audioIntensity / 255) * 2 + 0.5;
            
            this.matrixDrops[i] += speed;
            
            if (this.matrixDrops[i] > rect.height) {
                this.matrixDrops[i] = Math.random() * -100;
            }
            
            const char = this.matrixChars[Math.floor(Math.random() * this.matrixChars.length)];
            const color = this.getColor(colorMode, audioIntensity, i);
            
            this.ctx.fillStyle = color;
            this.ctx.font = `${fontSize}px monospace`;
            this.ctx.fillText(char, i * fontSize, this.matrixDrops[i]);
        }
    }

    draw3DCube(frequencyData, colorMode) {
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const size = Math.min(rect.width, rect.height) * 0.3;
        
        // Get audio intensity for rotation speed
        const bass = this.audioAnalyzer.getFrequencyBands().bass;
        const mid = this.audioAnalyzer.getFrequencyBands().mid;
        const treble = this.audioAnalyzer.getFrequencyBands().treble;
        
        // Update rotation based on audio
        this.cubeRotation.x += (bass / 100) * 0.02;
        this.cubeRotation.y += (mid / 100) * 0.03;
        this.cubeRotation.z += (treble / 100) * 0.01;
        
        // Define cube vertices
        const vertices = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ];
        
        // Project 3D points to 2D
        const projected = vertices.map(vertex => {
            const [x, y, z] = vertex;
            
            // Apply rotations
            let rotatedX = x;
            let rotatedY = y;
            let rotatedZ = z;
            
            // Rotate around X axis
            const cosX = Math.cos(this.cubeRotation.x);
            const sinX = Math.sin(this.cubeRotation.x);
            const newY = rotatedY * cosX - rotatedZ * sinX;
            const newZ = rotatedY * sinX + rotatedZ * cosX;
            rotatedY = newY;
            rotatedZ = newZ;
            
            // Rotate around Y axis
            const cosY = Math.cos(this.cubeRotation.y);
            const sinY = Math.sin(this.cubeRotation.y);
            const newX = rotatedX * cosY + rotatedZ * sinY;
            const newZ2 = -rotatedX * sinY + rotatedZ * cosY;
            rotatedX = newX;
            rotatedZ = newZ2;
            
            // Rotate around Z axis
            const cosZ = Math.cos(this.cubeRotation.z);
            const sinZ = Math.sin(this.cubeRotation.z);
            const newX2 = rotatedX * cosZ - rotatedY * sinZ;
            const newY2 = rotatedX * sinZ + rotatedY * cosZ;
            rotatedX = newX2;
            rotatedY = newY2;
            
            // Project to 2D
            const scale = 200 / (200 + rotatedZ * 100);
            const projX = rotatedX * scale * size + centerX;
            const projY = rotatedY * scale * size + centerY;
            
            return { x: projX, y: projY, z: rotatedZ };
        });
        
        // Define cube faces
        const faces = [
            [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
            [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]
        ];
        
        // Draw faces
        faces.forEach((face, index) => {
            const points = face.map(i => projected[i]);
            
            // Calculate face color based on audio
            const intensity = index < 2 ? bass : index < 4 ? mid : treble;
            const color = this.getColor(colorMode, intensity, index);
            
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        });
    }

    drawKaleidoscope(frequencyData, colorMode) {
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const radius = Math.min(rect.width, rect.height) * 0.4;
        
        // Get audio data for pattern generation
        const bass = this.audioAnalyzer.getFrequencyBands().bass;
        const mid = this.audioAnalyzer.getFrequencyBands().mid;
        const treble = this.audioAnalyzer.getFrequencyBands().treble;
        
        // Update pattern based on audio
        this.kaleidoscopePattern = [];
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const distance = (frequencyData[i] / 255) * radius * 0.8;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            this.kaleidoscopePattern.push({ x, y, intensity: frequencyData[i] });
        }
        
        // Draw kaleidoscope segments
        for (let segment = 0; segment < this.kaleidoscopeSegments; segment++) {
            const segmentAngle = (Math.PI * 2) / this.kaleidoscopeSegments;
            const startAngle = segment * segmentAngle;
            const endAngle = (segment + 1) * segmentAngle;
            
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle);
            
            // Draw pattern in this segment
            this.kaleidoscopePattern.forEach((point, index) => {
                const intensity = point.intensity;
                const color = this.getColor(colorMode, intensity, index + segment);
                
                this.ctx.fillStyle = color;
                this.ctx.globalAlpha = intensity / 255;
                
                // Draw mirrored points
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 3 + (intensity / 255) * 5, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Mirror across the segment boundary
                this.ctx.beginPath();
                this.ctx.arc(point.x, -point.y, 3 + (intensity / 255) * 5, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            this.ctx.restore();
        }
        
        this.ctx.globalAlpha = 1;
    }

    drawWaterRipples(frequencyData, colorMode) {
        const rect = this.canvas.getBoundingClientRect();
        
        // Add new ripples based on audio intensity
        const bass = this.audioAnalyzer.getFrequencyBands().bass;
        const mid = this.audioAnalyzer.getFrequencyBands().mid;
        const treble = this.audioAnalyzer.getFrequencyBands().treble;
        
        if (bass > 30) {
            this.ripples.push({
                x: Math.random() * rect.width,
                y: Math.random() * rect.height,
                radius: 0,
                maxRadius: 100 + (bass / 100) * 200,
                intensity: bass / 100,
                life: 1.0
            });
        }
        
        if (mid > 40) {
            this.ripples.push({
                x: Math.random() * rect.width,
                y: Math.random() * rect.height,
                radius: 0,
                maxRadius: 80 + (mid / 100) * 150,
                intensity: mid / 100,
                life: 1.0
            });
        }
        
        // Update and draw ripples
        this.ripples = this.ripples.filter(ripple => {
            ripple.radius += 2;
            ripple.life -= 0.01;
            
            if (ripple.radius > ripple.maxRadius || ripple.life <= 0) {
                return false;
            }
            
            // Draw ripple
            const alpha = ripple.life * ripple.intensity;
            const color = this.getColor(colorMode, ripple.intensity * 100, Math.floor(ripple.radius / 10));
            
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = alpha;
            
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            return true;
        });
        
        this.ctx.globalAlpha = 1;
    }

    drawSpectrogram(frequencyData, colorMode) {
        const rect = this.canvas.getBoundingClientRect();
        
        // Add current frequency data to history
        this.spectrogramData.unshift([...frequencyData]);
        
        // Keep only recent history
        if (this.spectrogramData.length > this.spectrogramHistory) {
            this.spectrogramData.pop();
        }
        
        // Draw spectrogram
        const cellWidth = rect.width / frequencyData.length;
        const cellHeight = rect.height / this.spectrogramData.length;
        
        for (let time = 0; time < this.spectrogramData.length; time++) {
            const timeData = this.spectrogramData[time];
            for (let freq = 0; freq < timeData.length; freq++) {
                const intensity = timeData[freq];
                const color = this.getColor(colorMode, intensity, freq);
                
                this.ctx.fillStyle = color;
                this.ctx.fillRect(
                    freq * cellWidth,
                    time * cellHeight,
                    cellWidth,
                    cellHeight
                );
            }
        }
    }

    animate() {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
        
        if (!this.audioAnalyzer.isAudioLoaded()) {
            this.drawLoadingScreen();
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }
        
        const frequencyData = this.audioAnalyzer.getFrequencyData();
        const timeDomainData = this.audioAnalyzer.getTimeDomainData();
        const vizMode = document.getElementById('vizMode').value;
        const colorMode = document.getElementById('colorMode').value;
        
        // Debug: Log data if available
        if (frequencyData && frequencyData.length > 0) {
            console.log('Frequency data received:', frequencyData.slice(0, 10));
        }
        
        if (!frequencyData || !timeDomainData) {
            // Draw a simple test pattern if no audio data
            this.drawTestPattern(rect);
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }
        
        switch (vizMode) {
            case 'bars':
                this.drawFrequencyBars(frequencyData, colorMode);
                break;
            case 'particles':
                this.drawParticleSystem(frequencyData, colorMode);
                break;
            case 'wave':
                this.drawWaveForm(timeDomainData, colorMode);
                break;
            case 'circle':
                this.drawCircularSpectrum(frequencyData, colorMode);
                break;
            case 'matrix':
                this.drawMatrixRain(frequencyData, colorMode);
                break;
            case 'cube3d':
                this.draw3DCube(frequencyData, colorMode);
                break;
            case 'kaleidoscope':
                this.drawKaleidoscope(frequencyData, colorMode);
                break;
            case 'ripples':
                this.drawWaterRipples(frequencyData, colorMode);
                break;
            case 'spectrogram':
                this.drawSpectrogram(frequencyData, colorMode);
                break;
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawTestPattern(rect) {
        // Draw a simple test pattern to verify canvas is working
        const time = Date.now() * 0.001;
        this.ctx.fillStyle = `hsl(${(time * 50) % 360}, 70%, 50%)`;
        this.ctx.fillRect(0, 0, rect.width, rect.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Audio loaded - waiting for data...', rect.width / 2, rect.height / 2);
    }

    drawLoadingScreen() {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎵', rect.width / 2, rect.height / 2 - 50);
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Load a music file to start visualizing', rect.width / 2, rect.height / 2);
    }

    start() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.animate();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resize() {
        this.resizeCanvas();
        this.initMatrix();
        this.initParticles();
    }
}
