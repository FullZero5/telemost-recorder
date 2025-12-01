const { chromium } = require('playwright');
const config = require('../config/default');
const logger = require('../utils/logger');

class BrowserManager {
    constructor(customConfig = {}) {
        this.config = { ...config.browser, ...customConfig };
        this.browser = null;
        this.page = null;
        this.context = null;
    }

    async launch() {
        logger.info(' Запускаем браузер...');
        
        this.browser = await chromium.launch(this.config);
        this.context = await this.browser.newContext({
            permissions: ['microphone', 'camera'],
            viewport: this.config.viewport
        });

        this.page = await this.context.newPage();
        logger.info(' Браузер запущен');
        return this;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            logger.info(' Браузер закрыт');
        }
    }

    getPage() {
        return this.page;
    }

    getContext() {
        return this.context;
    }

    getBrowser() {
        return this.browser;
    }
}

module.exports = BrowserManager;