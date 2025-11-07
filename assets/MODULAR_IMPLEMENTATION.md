# 📦 Implementazione Completa Moduli

Questo documento contiene il codice completo per tutti i moduli rimanenti.
Copia ogni sezione nel file corrispondente.

---

## 📁 config/dataSources.js

```javascript
// ========================================
// DATA SOURCES CONFIGURATION
// ========================================

const DATA_SOURCES = {
    'SOL': {
        'bonk': { 
            name: 'Bonk', 
            description: 'Bonk ecosystem analysis', 
            file: 'bonk.csv', 
            icon: '🐕' 
        },
        'pumpfun': { 
            name: 'PumpFun', 
            description: 'PumpFun platform analysis', 
            file: 'pumpfun.csv', 
            icon: '🚀' 
        },
        'trending': { 
            name: 'Trending', 
            description: 'Trending wallets analysis', 
            file: 'trending.csv', 
            icon: '📈' 
        },
        'trendfun': { 
            name: 'TrendFun', 
            description: 'TrendFun platform analysis', 
            file: 'trendfun.csv', 
            icon: '🎨' 
        },
        'boop': { 
            name: 'Boop', 
            description: 'Boop platform analysis', 
            file: 'boop.csv', 
            icon: '🎯' 
        },
        'believe': { 
            name: 'Believe', 
            description: 'Believe platform analysis', 
            file: 'believe.csv', 
            icon: '✨' 
        },
        'launchlab': { 
            name: 'LaunchLab', 
            description: 'LaunchLab platform analysis', 
            file: 'launchlab.csv', 
            icon: '🚀' 
        },
        'heaven': { 
            name: 'Heaven', 
            description: 'Heaven platform analysis', 
            file: 'heaven.csv', 
            icon: '☁️' 
        },
        'moonit': { 
            name: 'MoonIt', 
            description: 'MoonIt platform analysis', 
            file: 'moonit.csv', 
            icon: '🌙' 
        },
        'meteora': { 
            name: 'Meteora', 
            description: 'Meteora DEX analysis', 
            file: 'meteora.csv', 
            icon: '💫' 
        },
        'jupiter': { 
            name: 'Jupiter', 
            description: 'Jupiter aggregator analysis', 
            file: 'jupiter.csv', 
            icon: '🪐' 
        }
    },
    'BSC': {
        'trending_bsc': {
            name: 'Trending BSC',
            description: 'Trending BSC wallets',
            file: 'trending_bsc.csv',
            icon: '📈'
        },
        'fourmeme': {
            name: 'FourMeme',
            description: 'FourMeme platform analysis',
            file: 'fourmeme_bsc.csv',
            icon: '4️⃣'
        },
        'flap': {
            name: 'Flap',
            description: 'Flap platform analysis',
            file: 'flap_bsc.csv',
            icon: '🦅'
        },
        'xmode': {
            name: 'Xmode',
            description: 'Xmode Smart Chain traders',
            file: 'xmode_bsc.csv',
            icon: '⚡'
        }
    }
};

module.exports = { DATA_SOURCES };
```

---

## 📁 utils/validation.js

```javascript
// ========================================
// INTERACTION VALIDATOR
// ========================================
const { EmbedBuilder } = require('discord.js');

class InteractionValidator {
    static isExpired(interaction) {
        const interactionTime = interaction.createdTimestamp;
        const currentTime = Date.now();
        const timeDiff = currentTime - interactionTime;
        
        if (!interaction.replied && !interaction.deferred) {
            return timeDiff > 2000; // 2 secondi
        }
        
        if (interaction.deferred || interaction.replied) {
            return timeDiff > 14 * 60 * 1000; // 14 minuti
        }
        
        return timeDiff > 14 * 60 * 1000;
    }

    static async canRespond(interaction) {
        if (this.isExpired(interaction)) {
            const age = Date.now() - interaction.createdTimestamp;
            console.log(`[INTERACTION] ⏱️ Expired: ${age}ms old`);
            
            // Messaggio amichevole
            try {
                const user = await interaction.client.users.fetch(interaction.user.id);
                if (user) {
                    const expiredEmbed = new EmbedBuilder()
                        .setTitle('⏱️ Nessun Problema!')
                        .setDescription('Discord ha un limite di tempo per le interazioni (3 secondi).\n\n' +
                            '**Cosa è successo:** Hai impiegato un po\' più di tempo e Discord ha chiuso la connessione.\n\n' +
                            '**Soluzione:** Clicca di nuovo il pulsante! I tuoi progressi sono salvati. 😊')
                        .setColor('#FFA500')
                        .addFields({
                            name: '💡 Suggerimento',
                            value: 'Cerca di cliccare i pulsanti entro 2-3 secondi.',
                            inline: false
                        })
                        .setTimestamp();
                    
                    await user.send({ embeds: [expiredEmbed] });
                }
            } catch (e) {
                console.error('[INTERACTION] Failed to send DM:', e.message);
            }
            
            return false;
        }
        return true;
    }

    static getAge(interaction) {
        return Date.now() - interaction.createdTimestamp;
    }

    static canShowModal(interaction) {
        const age = this.getAge(interaction);
        return age < 2500; // 2.5 secondi
    }
}

module.exports = InteractionValidator;
```

---

## 📁 utils/interactionHelper.js

```javascript
// ========================================
// INTERACTION HELPER FUNCTIONS
// ========================================
const InteractionValidator = require('./validation');

async function safeReply(interaction, options, retries = 3) {
    // Force ephemeral
    if (options.ephemeral === undefined) {
        options.ephemeral = true;
    }
    
    if (!await InteractionValidator.canRespond(interaction)) {
        const age = Date.now() - interaction.createdTimestamp;
        console.log(`[SAFE_REPLY] ⏱️ Interaction too old (${age}ms), skipping`);
        return null;
    }

    for (let i = 0; i < retries; i++) {
        try {
            if (!await InteractionValidator.canRespond(interaction)) {
                console.log('[INTERACTION] Expired during retry');
                return null;
            }
            
            if (interaction.deferred) {
                return await interaction.editReply(options);
            } else if (interaction.replied) {
                return await interaction.followUp({ ...options, ephemeral: true });
            } else {
                return await interaction.reply(options);
            }
        } catch (error) {
            if (error.code === 10062) {
                console.log('[INTERACTION] Expired (10062)');
                return null;
            }
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    return null;
}

async function safeUpdate(interaction, options, retries = 3) {
    if (options.ephemeral === undefined) {
        options.ephemeral = true;
    }
    
    if (!await InteractionValidator.canRespond(interaction)) {
        return null;
    }

    for (let i = 0; i < retries; i++) {
        try {
            if (!await InteractionValidator.canRespond(interaction)) {
                console.log('[INTERACTION] Expired during retry');
                return null;
            }
            
            if (interaction.deferred || interaction.replied) {
                return await interaction.editReply(options);
            } else {
                if (interaction.isButton?.() || interaction.isStringSelectMenu?.() || interaction.isModalSubmit?.()) {
                    return await interaction.update(options);
                } else {
                    return await interaction.reply(options);
                }
            }
        } catch (error) {
            if (error.code === 10062) {
                console.log('[INTERACTION] Expired (10062)');
                return null;
            }
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    return null;
}

module.exports = {
    safeReply,
    safeUpdate
};
```

---

## 📁 managers/QueueManager.js

```javascript
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
```

---

**Continua con i file rimanenti nel prossimo blocco...**

