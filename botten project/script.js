class ButtonGame {
    constructor() {
        this.lamps = document.querySelectorAll('.lamp');
        this.button = document.getElementById('theButton');
        this.timerDisplay = document.getElementById('timer');
        this.scoreDisplay = document.getElementById('score');
        this.gameOverScreen = document.getElementById('gameOver');
        this.restartButton = document.getElementById('restartButton');
        this.aliveTimer = document.getElementById('aliveTimer');
        this.finalAliveTime = document.getElementById('finalAliveTime');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.startTimeDisplay = document.getElementById('startTime');
        this.clockInterval = null;
        this.startTime = null;
        
        this.totalTime = 43200; // 12 hours in seconds (12 * 60 * 60)
        this.timeRemaining = this.totalTime;
        this.score = 0;
        this.gameActive = true;
        this.lampInterval = Math.floor(this.totalTime / this.lamps.length); // Time between each lamp turning off
        this.nextLampOutTime = this.totalTime - this.lampInterval; // Time when next lamp should turn off
        this.scoreInterval = null;
        this.aliveTime = 0;
        this.aliveInterval = null;
        
        this.normalSpeed = 1000; // 1 second
        this.nightSpeed = 2000;  // 2 seconds (half speed)
        this.baseInterval = Math.floor(this.totalTime / this.lamps.length);
        
        this.lastColorBanner = document.getElementById('lastColorBanner');
        this.bannerLastClick = document.getElementById('bannerLastClick');
        
        // Load saved state or use defaults
        const savedState = this.loadGameState();
        if (savedState) {
            this.timeRemaining = savedState.timeRemaining;
            this.score = savedState.score;
            this.aliveTime = savedState.aliveTime;
            this.startTime = new Date(savedState.startTime);
            this.gameActive = savedState.gameActive;
        }

        this.init();
        this.initializeLampColors();
        this.startClock();
        this.updateLampColors(this.timeRemaining);
    }

    init() {
        this.button.addEventListener('click', () => this.resetLamps());
        this.restartButton.addEventListener('click', () => this.restartGame());
        this.startGame();
    }

    startGame() {
        this.gameActive = true;
        this.score = 0;
        this.aliveTime = 0;
        this.timeRemaining = this.totalTime;
        this.nextLampOutTime = this.totalTime - this.lampInterval;
        this.startTime = new Date();
        this.startTimeDisplay.textContent = this.formatTime(this.startTime);
        this.updateScore();
        this.gameOverScreen.classList.add('hidden');
        this.resetLamps();
        this.startTimer();
        this.startScoring();
        this.startAliveTimer();
        this.saveGameState(); // Save initial state
    }

    initializeLampColors() {
        const lamps = Array.from(this.lamps);
        
        // First 3 lamps are green
        lamps.slice(0, 3).forEach(lamp => {
            lamp.classList.add('green');
        });
        
        // Last 3 lamps are red
        lamps.slice(-3).forEach(lamp => {
            lamp.classList.add('red');
        });
        
        // Middle lamps remain yellow (default)
    }

    resetLamps() {
        // Get the current color before resetting
        const currentColor = this.getCurrentLampColor();
        
        this.lamps.forEach(lamp => {
            lamp.classList.remove('off');
        });
        // Reset colors to green when resetting lamps
        this.updateLampColors(this.totalTime);
        
        // Reset the countdown timer and adjust for current speed
        this.timeRemaining = this.totalTime;
        this.nextLampOutTime = this.totalTime - this.getLampInterval();
        this.timerDisplay.textContent = this.formatDuration(this.timeRemaining);
        
        // Update the banner with the color at time of click
        this.updateLastColorBanner(currentColor);
        
        this.updateScore();
    }

    turnOffNextLamp() {
        const lampsOn = Array.from(this.lamps).filter(lamp => !lamp.classList.contains('off'));
        if (lampsOn.length > 0) {
            // Get the first lamp that's still on (leftmost)
            const firstLampOn = lampsOn[0];
            firstLampOn.classList.add('off');
            
            // Check if all lamps are off
            if (lampsOn.length === 1) {
                this.endGame();
            }
        }
    }

    isNightTime() {
        const now = new Date();
        const hour = now.getHours();
        return hour >= 21 || hour < 6;
    }

    getTimerSpeed() {
        return this.isNightTime() ? this.nightSpeed : this.normalSpeed;
    }

    getLampInterval() {
        // Adjust lamp interval based on current speed
        return this.baseInterval * (this.getTimerSpeed() / 1000);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.gameActive) {
                this.timeRemaining--;
                this.timerDisplay.textContent = this.formatDuration(this.timeRemaining);
                
                this.updateLampColors(this.timeRemaining);
                
                const currentInterval = this.getLampInterval();
                if (this.timeRemaining <= this.nextLampOutTime) {
                    this.turnOffNextLamp();
                    this.nextLampOutTime -= currentInterval;
                }
                
                // Save state every second
                this.saveGameState();
                
                if (this.timeRemaining <= 0) {
                    this.endGame();
                }
            }
        }, this.getTimerSpeed());
    }

    updateScore() {
        this.scoreDisplay.textContent = this.score;
    }

    startScoring() {
        this.scoreInterval = setInterval(() => {
            if (this.gameActive) {
                const lampsOff = Array.from(this.lamps).filter(lamp => 
                    lamp.classList.contains('off')
                ).length;
                
                // Score increases by number of lamps that are off
                if (lampsOff > 0) {
                    this.score += lampsOff;
                    this.updateScore();
                }
            }
        }, this.getTimerSpeed()); // Match scoring speed to timer speed
    }

    startAliveTimer() {
        this.aliveInterval = setInterval(() => {
            if (this.gameActive) {
                this.aliveTime++;
                this.aliveTimer.textContent = this.formatDuration(this.aliveTime);
                this.finalAliveTime.textContent = this.formatDuration(this.aliveTime);
            }
        }, this.getTimerSpeed());
    }

    endGame() {
        this.gameActive = false;
        clearInterval(this.timerInterval);
        clearInterval(this.scoreInterval);
        clearInterval(this.aliveInterval);
        this.finalAliveTime.textContent = this.formatDuration(this.aliveTime);
        this.gameOverScreen.classList.remove('hidden');
        this.clearGameState(); // Clear saved state when game ends
    }

    restartGame() {
        clearInterval(this.timerInterval);
        clearInterval(this.scoreInterval);
        clearInterval(this.aliveInterval);
        this.clearGameState(); // Clear saved state before restart
        this.resetLamps();
        this.startGame();
    }

    formatTime(date) {
        const dateStr = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        return `${dateStr} ${timeStr}`;
    }

    formatDuration(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const remainingSeconds = seconds % 60;

        let timeString = '';
        if (days > 0) timeString += `${days}d `;
        if (hours > 0 || days > 0) timeString += `${hours}h `;
        if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `;
        timeString += `${remainingSeconds}s`;

        return timeString;
    }

    startClock() {
        // Update immediately
        this.updateClock();
        
        // Then update every second
        this.clockInterval = setInterval(() => {
            this.updateClock();
        }, 1000);
    }

    updateClock() {
        const now = new Date();
        this.currentTimeDisplay.textContent = this.formatTime(now);
    }

    updateLampColors(timeRemaining) {
        const lamps = Array.from(this.lamps);
        const percentageRemaining = timeRemaining / this.totalTime;
        
        lamps.forEach(lamp => {
            // Remove existing color classes
            lamp.classList.remove('green', 'blue', 'yellow', 'orange', 'red');
            
            if (percentageRemaining > 0.8) {
                lamp.classList.add('green');
            } else if (percentageRemaining > 0.6) {
                lamp.classList.add('blue');
            } else if (percentageRemaining > 0.4) {
                lamp.classList.add('yellow');
            } else if (percentageRemaining > 0.2) {
                lamp.classList.add('orange');
            } else {
                lamp.classList.add('red');
            }
        });
    }

    getCurrentLampColor() {
        const percentageRemaining = this.timeRemaining / this.totalTime;
        
        if (percentageRemaining > 0.8) return 'green';
        if (percentageRemaining > 0.6) return 'blue';
        if (percentageRemaining > 0.4) return 'yellow';
        if (percentageRemaining > 0.2) return 'orange';
        return 'red';
    }

    updateLastColorBanner(color) {
        this.lastColorBanner.className = 'last-color-banner';
        this.lastColorBanner.classList.add(color);
        this.bannerLastClick.textContent = this.formatTime(new Date());
    }

    saveGameState() {
        const gameState = {
            timeRemaining: this.timeRemaining,
            score: this.score,
            aliveTime: this.aliveTime,
            startTime: this.startTime.toISOString(),
            gameActive: this.gameActive,
            lastSaveTime: new Date().toISOString() // Add save timestamp
        };
        localStorage.setItem('buttonGameState', JSON.stringify(gameState));
    }

    loadGameState() {
        const saved = localStorage.getItem('buttonGameState');
        if (!saved) return null;

        const savedState = JSON.parse(saved);
        const lastSaveTime = new Date(savedState.lastSaveTime).getTime();
        const currentTime = new Date().getTime();
        const timeDifference = (currentTime - lastSaveTime) / 1000; // Convert to seconds

        // If more than 8 hours have passed since last save, force game over
        if (timeDifference > 28800) {
            this.clearGameState();
            return null;
        }

        // Adjust the timeRemaining based on elapsed time
        savedState.timeRemaining = Math.max(0, savedState.timeRemaining - timeDifference);
        savedState.aliveTime = savedState.aliveTime + timeDifference;

        return savedState;
    }

    clearGameState() {
        localStorage.removeItem('buttonGameState');
    }
}

class CommentSystem {
    constructor(game) {
        this.game = game;  // Store reference to the game
        this.commentInput = document.getElementById('commentInput');
        this.addCommentBtn = document.getElementById('addComment');
        this.commentsContainer = document.getElementById('comments-container');
        
        this.setupEventListeners();
        this.loadComments();
        this.commands = {
            '/clear': () => this.clearAllComments(),
            '/clearlast': () => this.clearLastComment(),
            '/restart': () => this.restartEverything()
        };
    }

    setupEventListeners() {
        this.addCommentBtn.addEventListener('click', () => this.addComment());
        this.commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addComment();
            }
        });
    }

    addComment() {
        const text = this.commentInput.value.trim();
        if (text) {
            // Check if the text is a command
            if (this.commands[text.toLowerCase()]) {
                this.commands[text.toLowerCase()]();
            } else {
                const comment = {
                    text,
                    timestamp: new Date().toISOString(),
                };
                
                this.saveComment(comment);
                this.displayComment(comment);
            }
            this.commentInput.value = '';
        }
    }

    saveComment(comment) {
        const comments = this.getStoredComments();
        comments.push(comment);
        localStorage.setItem('buttonComments', JSON.stringify(comments));
    }

    getStoredComments() {
        const stored = localStorage.getItem('buttonComments');
        return stored ? JSON.parse(stored) : [];
    }

    loadComments() {
        const comments = this.getStoredComments();
        comments.forEach(comment => this.displayComment(comment));
    }

    displayComment(comment) {
        const div = document.createElement('div');
        div.className = 'comment';
        
        const time = new Date(comment.timestamp);
        const timeStr = time.toLocaleString();
        
        div.innerHTML = `
            <div class="comment-time">${timeStr}</div>
            <div class="comment-text">${this.escapeHtml(comment.text)}</div>
        `;
        
        this.commentsContainer.appendChild(div);
        this.commentsContainer.scrollTop = this.commentsContainer.scrollHeight;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    clearAllComments() {
        localStorage.removeItem('buttonComments');
        this.commentsContainer.innerHTML = '';
    }

    clearLastComment() {
        const comments = this.getStoredComments();
        if (comments.length > 0) {
            comments.pop(); // Remove last comment
            localStorage.setItem('buttonComments', JSON.stringify(comments));
            
            // Refresh the display
            this.commentsContainer.innerHTML = '';
            comments.forEach(comment => this.displayComment(comment));
        }
    }

    restartEverything() {
        // Clear all comments
        this.clearAllComments();
        // Restart the game
        this.game.restartGame();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    const game = new ButtonGame();
    new CommentSystem(game);
});

function toggleDescription() {
    const description = document.getElementById('description');
    if (description.classList.contains('hidden')) {
        description.classList.remove('hidden');
    } else {
        description.classList.add('hidden');
    }
} 