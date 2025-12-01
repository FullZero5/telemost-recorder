const path = require('path');
module.exports = {
    browser: {
        headless: false,
        viewport: { width: 1200, height: 800 },
        args: [
            '--no-sandbox',
            '--disable-web-security',
            '--allow-file-access-from-files',
            '--autoplay-policy=no-user-gesture-required',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            `--use-file-for-fake-video-capture=${path.join(process.cwd(), 'm2.y4m')}`,
            `--use-file-for-fake-audio-capture=${path.join(process.cwd(), 'audio.wav')}`
        ]
    },
    audio: {
        device: 'audio=Stereo Mix (Realtek(R) Audio)',
        format: 'wav',
        channels: 2,
        sampleRate: 44100
    },
    meeting: {
        steps: [
            {
                selector: 'button:has-text("Продолжить в браузере")',
                //selector: '[data-testid="orb-button"]',
                description: 'Продолжить в браузере',
                delay: 1000
            },
            {
                selector: 'button:has-text("Подключиться")',
                description: 'Подключиться к конференции',
                delay: 8000
            },
            {
                selector: 'button:has-text("Понятно")',
                description: 'Закрыть диалог ошибки',
                delay: 3000
            },
            {
                selector: '.Textinput-Control[value="Гость"]',
                description: 'Изменяем имя на "Родина"',
                delay: 2000,
                action: 'fill',
                value: 'Родина'
            },
        ],
        connectionCheckSelector: 'video, .conference-room',
        timeout: 60000
    },
    recording: {
        defaultDuration: 60000,
        monitoringInterval: 5000,
        progressReportInterval: 10000
    },
    storage: {
        outputDir: 'recordings',      // Папка для записи
        filenameTemplate: 'telemost-{timestamp}.{format}'
    },
    logging: {
        level: 'info',
        logToFile: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        format: 'YYYY-MM-DD HH:mm:ss'
    }
};