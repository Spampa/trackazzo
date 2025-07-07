import * as cron from 'node-cron';
import { PriceMonitoringService } from '../services/priceMonitoringService';

const monitoringService = new PriceMonitoringService();

export class PriceMonitoringJob {
    private static instance: PriceMonitoringJob;
    private cronJob: cron.ScheduledTask | null = null;
    private isRunning = false;

    private constructor() {}

    public static getInstance(): PriceMonitoringJob {
        if (!PriceMonitoringJob.instance) {
            PriceMonitoringJob.instance = new PriceMonitoringJob();
        }
        return PriceMonitoringJob.instance;
    }

    /**
     * Avvia il cron job per il monitoraggio prezzi ogni 60 secondi
     */
    public start(): void {
        if (this.cronJob) {
            return;
        }

        console.log('🚀 Avvio monitoraggio automatico');

        // Cron job ogni 60 secondi: '*/60 * * * * *'
        this.cronJob = cron.schedule('*/60 * * * * *', async () => {
            if (this.isRunning) {
                return;
            }

            this.isRunning = true;

            try {
                await monitoringService.monitorAllProducts();
            } catch (error) {
                console.error('❌ Errore nel cron job di monitoraggio:', error);
            } finally {
                this.isRunning = false;
            }
        }, {
            timezone: "Europe/Rome"
        });

        // Avvia il job
        this.cronJob.start();

        // Job di pulizia giornaliero alle 3:00
        cron.schedule('0 3 * * *', async () => {
            try {
                await monitoringService.cleanupOldPriceHistory();
            } catch (error) {
                console.error('❌ Errore nella pulizia giornaliera:', error);
            }
        }, {
            timezone: "Europe/Rome"
        });
    }

    /**
     * Ferma il cron job
     */
    public stop(): void {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
        }
    }

    /**
     * Ottieni lo stato del job
     */
    public getStatus(): { isActive: boolean; isRunning: boolean } {
        return {
            isActive: this.cronJob !== null,
            isRunning: this.isRunning
        };
    }

    /**
     * Esegui monitoraggio manuale (per test)
     */
    public async runManual(): Promise<void> {
        if (this.isRunning) {
            throw new Error('Monitoraggio già in corso');
        }

        this.isRunning = true;

        try {
            await monitoringService.monitorAllProducts();
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Ottieni statistiche del monitoraggio
     */
    public async getStats() {
        return await monitoringService.getMonitoringStats();
    }

    /**
     * Cleanup delle risorse
     */
    public async cleanup(): Promise<void> {
        this.stop();
        await monitoringService.cleanup();
    }
}
