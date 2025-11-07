// ========================================
// QUEUE MANAGER - GESTIONE CODE CONCORRENTI
// ========================================
const EventEmitter = require('events');

class QueueManager extends EventEmitter {
    constructor() {
        super();
        this.queues = new Map();
        this.processing = new Map();
        this.rateLimits = new Map();
        this.maxConcurrent = 15;
        this.currentProcessing = 0;
        this.queueTimeout = 60000;
        this.rateLimit = 1000;
    }

    async addToQueue(userId, operation, priority = 0) {
        if (!this.queues.has(userId)) {
            this.queues.set(userId, []);
        }

        const queueItem = {
            operation,
            priority,
            timestamp: Date.now(),
            retries: 0,
            maxRetries: 3,
            id: `${userId}_${Date.now()}_${Math.random()}`
        };

        const queue = this.queues.get(userId);
        queue.push(queueItem);
        queue.sort((a, b) => b.priority - a.priority);

        setImmediate(() => this.processQueue(userId));

        return queueItem;
    }

    async processQueue(userId) {
        if (this.processing.get(userId)) return;
        if (this.currentProcessing >= this.maxConcurrent) {
            setTimeout(() => this.processQueue(userId), 500);
            return;
        }

        const lastProcess = this.rateLimits.get(userId) || 0;
        const timeSinceLastProcess = Date.now() - lastProcess;
        if (timeSinceLastProcess < this.rateLimit) {
            setTimeout(() => this.processQueue(userId), this.rateLimit - timeSinceLastProcess);
            return;
        }

        const queue = this.queues.get(userId);
        if (!queue || queue.length === 0) return;

        const queueItem = queue.shift();
        
        if (Date.now() - queueItem.timestamp > this.queueTimeout) {
            this.emit('timeout', { userId, item: queueItem });
            this.processQueue(userId);
            return;
        }

        this.processing.set(userId, true);
        this.currentProcessing++;
        this.rateLimits.set(userId, Date.now());

        try {
            await queueItem.operation();
            this.emit('success', { userId, item: queueItem });
        } catch (error) {
            console.error(`Queue error for user ${userId}:`, error);
            queueItem.retries++;

            if (queueItem.retries < queueItem.maxRetries) {
                setTimeout(() => {
                    queue.unshift(queueItem);
                    this.processQueue(userId);
                }, Math.pow(2, queueItem.retries) * 1000);
            } else {
                this.emit('error', { userId, item: queueItem, error });
            }
        } finally {
            this.processing.set(userId, false);
            this.currentProcessing--;
            setImmediate(() => this.processQueue(userId));
        }
    }

    getQueueSize(userId) {
        return this.queues.get(userId)?.length || 0;
    }

    getTotalQueued() {
        let total = 0;
        for (const queue of this.queues.values()) {
            total += queue.length;
        }
        return total;
    }

    clearUserQueue(userId) {
        this.queues.delete(userId);
        this.processing.delete(userId);
        this.rateLimits.delete(userId);
    }
}

module.exports = QueueManager;