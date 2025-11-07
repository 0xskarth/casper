// ========================================
// INTERACTION VALIDATOR - Optimized for Slow Users
// ========================================

const { EmbedBuilder } = require('discord.js');

class InteractionValidator {
    static isExpired(interaction) {
        const interactionTime = interaction.createdTimestamp;
        const currentTime = Date.now();
        const timeDiff = currentTime - interactionTime;

        // Timeout più permissivi per utenti lenti/indecisi
        if (!interaction.replied && !interaction.deferred) {
            return timeDiff > 2000; // 2 secondi (più aggressivo)
        }

        // Per followup/editReply dopo defer - molto più generoso
        if (interaction.deferred || interaction.replied) {
            return timeDiff > 14 * 60 * 1000; // 14 minuti completi
        }

        return timeDiff > 14 * 60 * 1000;
    }

    static async canRespond(interaction) {
        if (this.isExpired(interaction)) {
            const age = Date.now() - interaction.createdTimestamp;
            console.log(`[INTERACTION] ⏱️ Expired: ${age}ms old`);

            // Messaggio più amichevole per utenti lenti
            if (interaction.channel) {
                try {
                    const expiredEmbed = new EmbedBuilder()
                        .setTitle('⏱️ Taking Your Time? No Problem!')
                        .setDescription('Discord has a time limit for interactions (3 seconds).\n\n' +
                            '**What happened:** You took a bit longer to respond, and Discord closed the connection.\n\n' +
                            '**Solution:** Just click the button again! Your progress is saved. 😊')
                        .setColor('#FFA500')
                        .addFields({
                            name: '💡 Tip for Next Time',
                            value: 'Try to click buttons within 2-3 seconds, or the scanner will ask "Are you still there?" after 5 minutes of inactivity.',
                            inline: false
                        })
                        .setTimestamp();

                    await interaction.channel.send({
                        content: `<@${interaction.user.id}>`,
                        embeds: [expiredEmbed]
                    });
                } catch (e) {
                    console.error('[INTERACTION] Failed to send expired notification:', e.message);
                }
            }

            return false;
        }
        return true;
    }

    static getAge(interaction) {
        return Date.now() - interaction.createdTimestamp;
    }

    // Modal timeout più permissivo
    static canShowModal(interaction) {
        const age = this.getAge(interaction);
        return age < 2500; // 2.5 secondi (era meno)
    }
}

module.exports = InteractionValidator;
