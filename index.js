const Application = require('./app/Application');
const logger = require('./utils/logger');

// Конфигурация приложения
const config = {
    meetingUrl: 'https://telemost.yandex.ru/j/38748969812297',
    duration: 900000 // 30 секунд
};

// Запуск приложения
Application.run(config)
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        logger.error(' Фатальная ошибка:', error);
        process.exit(1);
    });