const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config/default');
const logger = require('../utils/logger');

class AudioRecorder {
    constructor(audioConfig = {}, storageConfig = {}) {
        this.config = { ...config.audio, ...audioConfig };
        this.storageConfig = storageConfig;
        this.process = null;
        this.audioFile = null;
        this.isRecording = false;
    }

    generateFilename() {
        
        const now = new Date();
        const outputDir = this.storageConfig?.outputDir || '.';
        const template = this.storageConfig?.filenameTemplate || 'telemost-recording-{timestamp}.{format}';

        const filename = template
            .replace(/{timestamp}/g, now.toISOString().replace(/[:.]/g, '-'))
            .replace(/{datetime}/g, now.toISOString().replace(/[:.]/g, '-'))
            .replace(/{date}/g, now.toISOString().split('T')[0])
            .replace(/{time}/g, now.toTimeString().split(' ')[0].replace(/:/g, '-'))
            .replace(/{year}/g, now.getFullYear())
            .replace(/{month}/g, String(now.getMonth() + 1).padStart(2, '0'))
            .replace(/{day}/g, String(now.getDate()).padStart(2, '0'))
            .replace(/{hours}/g, String(now.getHours()).padStart(2, '0'))
            .replace(/{minutes}/g, String(now.getMinutes()).padStart(2, '0'))
            .replace(/{seconds}/g, String(now.getSeconds()).padStart(2, '0'))
            .replace(/{format}/g, this.config.format);

        // Создать папку если не существует
        const targetFolderPath = path.resolve(process.cwd(), outputDir);
       
        if (!fs.existsSync(targetFolderPath)) {
            fs.mkdirSync(targetFolderPath, { recursive: true });
        }

        return path.join(targetFolderPath, filename);
    }

    getFFmpegArgs() {
        const baseArgs = [
            '-f', 'dshow',
            '-i', this.config.device,
            '-ac', this.config.channels.toString(),
            '-ar', this.config.sampleRate.toString(),
        ];

        if (this.config.format === 'mp3') {
            baseArgs.push('-codec:a', 'libmp3lame', '-qscale:a', '2');
        }

        baseArgs.push(this.audioFile);
        return baseArgs;
    }

    async start() {
        this.audioFile = this.generateFilename();
        logger.info(`️ Запускаем запись: ${this.audioFile}`);

        this.process = spawn('ffmpeg', this.getFFmpegArgs(), {
            stdio: 'pipe',
            windowsHide: false
        });

        this.setupEventHandlers();

        await this.waitForStart(5000);
        return this.isRecording;
    }

    setupEventHandlers() {
        this.process.stderr.on('data', (data) => {
            this.handleFFmpegOutput(data.toString());
        });

        this.process.on('error', (error) => {
            logger.error('\n Ошибка запуска FFmpeg:', error.message);
            this.isRecording = false;
        });

        this.process.on('close', (code) => {
            logger.error(`\n FFmpeg завершился с кодом: ${code}`);
            this.isRecording = false;
        });
    }

    handleFFmpegOutput(output) {
        if (output.includes('time=')) {
            const timeMatch = output.match(/time=(\d+:\d+:\d+\.\d+)/);
            if (timeMatch) {
                process.stdout.write(`\r⏱️ Запись: ${timeMatch[1]}...`);
            }
        }
        else if (output.includes('Error') || output.includes('Invalid')) {
            logger.error('\n FFmpeg ошибка:', output.trim());
        }
        else if (output.includes('Press') || output.includes('start')) {
            logger.info('\n FFmpeg начал запись');
            this.isRecording = true;
        }
    }

    async waitForStart(timeout = 5000) {
        logger.info(`⏳ Ожидаем запуска FFmpeg (${timeout}ms)...`);
        await new Promise(resolve => setTimeout(resolve, timeout));

        if (this.process && !this.process.killed && this.isRecording) {
            logger.info(' FFmpeg запущен и записывает!');
            return true;
        } else {
            logger.error(' FFmpeg не запустился');
            return false;
        }
    }

    async stop() {
        if (!this.process || this.process.killed) return;

        logger.info('\n⏹️ Останавливаем запись...');
        this.process.kill('SIGINT');

        await new Promise(resolve => {
            this.process.on('exit', () => {
                logger.info(' FFmpeg остановлен');
                resolve();
            });
            setTimeout(resolve, 3000);
        });

        return await this.verifyRecording();
    }

    async verifyRecording() {
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (fs.existsSync(this.audioFile)) {
            const stats = fs.statSync(this.audioFile);
            const fileSize = Math.round(stats.size / 1024);
            logger.info(` Файл создан: ${this.audioFile}`);
            logger.info(` Размер: ${fileSize} KB`);

            if (fileSize > 10) {
                logger.info(' ЗАПИСЬ УСПЕШНА!');
                return true;
            } else {
                logger.error('️ Файл очень маленький, возможно запись пустая');
                return false;
            }
        } else {
            logger.error(' Файл не создан');
            return false;
        }
    }

    getRecordingPath() {
        return this.audioFile;
    }

    getIsRecording() {
        return this.isRecording;
    }
}

module.exports = AudioRecorder;