const config = require('../config/default');
const logger = require('../utils/logger');

class MeetingManager {
    constructor(browserManager, customConfig = {}) {
        this.browserManager = browserManager;
        this.config = { ...config.meeting, ...customConfig };
        this.isConnected = false;
    }

    async connect(url) {
        try {
            logger.info(` Подключаемся: ${url}`);
            const page = this.browserManager.getPage();

            await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: this.config.timeout
            });

            logger.info(' Страница загружена...');

            await this.performConnectionSteps();
            await this.verifyConnection();

            return this.isConnected;

        } catch (error) {
            logger.error(' Ошибка подключения:', error.message);
            return false;
        }
    }

    async performConnectionSteps() {
        const page = this.browserManager.getPage();

        for (const step of this.config.steps) {
            await page.waitForTimeout(2000);
            const element = await page.$(step.selector);
            
            if (element) {
                await element.click();
                logger.info(` ${step.description}`);
                await page.waitForTimeout(step.delay);
            }
        }
    }

    async verifyConnection() {
        const page = this.browserManager.getPage();
        await page.waitForTimeout(10000);
        
        const videoElement = await page.$(this.config.connectionCheckSelector);
        if (videoElement) {
            logger.info(' УСПЕШНО ПОДКЛЮЧИЛИСЬ К КОНФЕРЕНЦИИ!');
            this.isConnected = true;
        } else {
            logger.error(' Не удалось подтвердить подключение');
            this.isConnected = false;
        }
    }
    async monitorConnection() {
        const page = this.browserManager.getPage();
        const element = await page.$(this.config.connectionCheckSelector);
        return !!element;
    }

    getIsConnected() {
        return this.isConnected;
    }
}

module.exports = MeetingManager;