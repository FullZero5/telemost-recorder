const BrowserManager = require('../core/BrowserManager');
const MeetingManager = require('../core/MeetingManager');
const AudioRecorder = require('../core/AudioRecorder');
const config = require('../config/default');
const logger = require('../utils/logger');

class TelemostRecorder {
    constructor(customConfig = {}) {
        this.config = { ...config, ...customConfig };
        this.browserManager = new BrowserManager(this.config.browser);
        this.meetingManager = null;
        this.audioRecorder = new AudioRecorder(this.config.audio, this.config.storage);
        this.isRecording = false;
    }

    async initialize() {
        await this.browserManager.launch();
        this.meetingManager = new MeetingManager(this.browserManager, this.config.meeting);
        logger.info('✅ Рекордер инициализирован');
        return this;
    }

    async startRecordingSession(meetingUrl, duration = this.config.recording.defaultDuration) {
        logger.info('🎯 Начинаем сессию записи...');

        const connected = await this.meetingManager.connect(meetingUrl);
        if (!connected) {
            logger.error('❌ Не удалось подключиться к встрече');
            return false;
        }

        logger.info('\n🔊 ЗАПУСК ЗАПИСИ ЗВУКА...');
        const recordingStarted = await this.audioRecorder.start();
        
        if (!recordingStarted) {
            logger.error('❌ Не удалось запустить запись звука');
            return false;
        }

        this.isRecording = true;
        await this.monitorSession(duration);
        await this.audioRecorder.stop();
        this.isRecording = false;
        
        return true;
    }

    async monitorSession(duration) {
        logger.info(`\n⏱️ СЕССИЯ ЗАПИСИ (${duration / 1000} секунд)...`);
        
        const startTime = Date.now();
        let secondsPassed = 0;

        while (secondsPassed < duration / 1000) {
            await this.browserManager.getPage().waitForTimeout(this.config.recording.monitoringInterval);
            secondsPassed = Math.round((Date.now() - startTime) / 1000);

            if (secondsPassed % 10 === 0) {
                logger.info(`📈 Мониторинг: ${secondsPassed} секунд`);
            }

            const stillConnected = await this.meetingManager.monitorConnection();
            if (!stillConnected) {
                logger.info('⚠️ Соединение с конференцией потеряно');
                break;
            }
        }

        logger.info('\n🛑 ЗАВЕРШЕНИЕ СЕССИИ...');
    }

    async close() {
        if (this.audioRecorder && this.audioRecorder.getIsRecording()) {
            await this.audioRecorder.stop();
        }
        
        await this.browserManager.close();
        logger.info('✅ Рекордер завершил работу');
    }

    getRecordingInfo() {
        return {
            filePath: this.audioRecorder.getRecordingPath(),
            isRecording: this.audioRecorder.getIsRecording(),
            isConnected: this.meetingManager ? this.meetingManager.getIsConnected() : false
        };
    }

    getIsRecording() {
        return this.isRecording;
    }
}

module.exports = TelemostRecorder;