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
