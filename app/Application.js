const TelemostRecorder = require('../services/TelemostRecorder');
const DependencyChecker = require('../utils/dependencies');
const logger = require('../utils/logger');

class Application {
    static async run(options = {}) {
        const {
            meetingUrl = 'https://telemost.yandex.ru/j/20228289839750',
            duration = 30000
        } = options;

        if (!await DependencyChecker.checkAll()) {
            throw new Error('Не все зависимости установлены');
        }

        const recorder = new TelemostRecorder();
        
        try {
            await recorder.initialize();
            const success = await recorder.startRecordingSession(meetingUrl, duration);

            if (success) {
                this.printFinalReport(recorder);
            } else {
                logger.error(' Сессия записи завершилась с ошибками');
            }

            return success;

        } catch (error) {
            logger.error(' Критическая ошибка:', error);
            throw error;
        } finally {
            await recorder.close();
        }
    }

    static printFinalReport(recorder) {
        const info = recorder.getRecordingInfo();
        
        logger.info('\n ФИНАЛЬНЫЙ ОТЧЕТ:');
        logger.info('    Автоподключение к Телемосту - РАБОТАЕТ');
        logger.info('    Stereo Mix - АКТИВИРОВАН');
        logger.info('    Запись звука - ЗАПУЩЕНА');
        logger.info(`    Аудиофайл: ${info.filePath}`);
    }
}

module.exports = Application;