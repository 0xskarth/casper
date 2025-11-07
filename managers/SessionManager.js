// ========================================
// INTERACTION CREATE EVENT - CON SUPPORTO DM
// ========================================
const ErrorHandler = require('../managers/ErrorHandler');
const InteractionValidator = require('../utils/validation');
const { EmbedBuilder } = require('discord.js');

// Import handlers
const buttonHandler = require('../handlers/buttonHandler');
const selectMenuHandler = require('../handlers/selectMenuHandler');
const modalHandler = require('../handlers/modalHandler');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const userId = interaction.user.id;
        const username = interaction.user.username;

        // ✅ Check timeout immediato
        const interactionAge = Date.now() - interaction.createdTimestamp;
        
        if (interactionAge > 2800) {
            console.log(`[TIMEOUT_SKIP] ⏱️ Interaction ${interactionAge}ms old - Skipping`);
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    if (interaction.isModalSubmit()) {
                        // Invia messaggio amichevole in DM se possibile
                        try {
                            const user = await client.users.fetch(userId);
                            const embed = new EmbedBuilder()
                                .setTitle('⏱️ Configurazione Troppo Lenta')
                                .setDescription('Discord ha chiuso la connessione perché la finestra di configurazione era aperta da più di 3 secondi.\n\n' +
                                    '**Il tuo filtro NON è stato salvato.**\n\n' +
                                    '💡 **Suggerimento:** Compila i form di configurazione entro 2-3 secondi e premi Invia!')
                                .setColor('#FFA500')
                                .setTimestamp();
                            
                            await user.send({ embeds: [embed] });
                        } catch (e) {
                            console.log('[TIMEOUT] Could not send DM:', e.message);
                        }
                    } else {
                        await interaction.reply({
                            content: '⏱️ **Timeout** - Clicca di nuovo il pulsante. I tuoi progressi sono salvati! 😊',
                            ephemeral: true
                        });
                    }
                }
            } catch (e) {
                console.log('[TIMEOUT_SKIP] Could not reply:', e.message);
            }
            return;
        }

        // ✅ Processa l'interazione con error isolation
        await ErrorHandler.safeExecute(client, userId, username, async () => {
            if (interaction.isCommand()) {
                // ✅ SUPPORTO DM: Gestisce comandi sia in guild che in DM
                if (interaction.commandName === 'scan') {
                    // Determina channelId (null se in DM)
                    const channelId = interaction.channelId;
                    const isInDM = !interaction.inGuild();
                    
                    if (isInDM) {
                        console.log(`[SCAN_DM] User ${username} (${userId}) started scan in DM`);
                    } else {
                        console.log(`[SCAN_GUILD] User ${username} (${userId}) started scan in guild`);
                    }
                    
                    const session = await client.sessionManager.getSession(userId, channelId);
                    await session.sendIntro(interaction, isInDM);
                }
            } else {
                // Ottieni sessione esistente
                const session = await client.sessionManager.getSession(userId, interaction.channelId);

                if (interaction.isButton()) {
                    await buttonHandler.handle(interaction, session, client);
                } else if (interaction.isStringSelectMenu()) {
                    await selectMenuHandler.handle(interaction, session, client);
                } else if (interaction.isModalSubmit()) {
                    await modalHandler.handle(interaction, session, client);
                }
            }
        }, interaction);
    }
};