const { execSync } = require('child_process');
const logger = require('../utils/logger');

class DependencyChecker {
    static checkFFmpeg() {
        try {
            execSync('ffmpeg -version', { stdio: 'ignore' });
            logger.info(' FFmpeg доступен');
            return true;
        } catch (error) {
            logger.error(' FFmpeg не найден');
            return false;
        }
    }

    static async checkAll() {
        logger.info(' Проверка зависимостей...');
        const ffmpegAvailable = this.checkFFmpeg();
        
        if (!ffmpegAvailable) {
            logger.error(' Установите FFmpeg: https://ffmpeg.org/download.html');
        }
        
        return ffmpegAvailable;
    }
}

module.exports = DependencyChecker;