// ========================================
// ERROR ISOLATION WRAPPER
// ========================================
class ErrorHandler {
    static async safeExecute(userId, username, operation, interaction = null) {
    try {
        return await operation();
    } catch (error) {
        console.error(`[USER_ERROR] User ${username} (${userId}):`, error);
        
        // ✅ Ignora errori di timeout noti (non loggare come errori critici)
        if (error.code === 10062 || error.message?.includes('Unknown interaction')) {
            console.log(`[TIMEOUT] User ${username} had interaction timeout - not critical`);
            return null;
        }
            
            // Log to channel
            await this.logError(userId, username, error);
            
            // Notify user if interaction is available
            if (interaction && !interaction.replied && !interaction.deferred) {
                try {
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ An Error Occurred')
                        .setDescription('We encountered an issue processing your request.\n\n' +
                            '**Please contact support by opening a ticket.**\n' +
                            'Error details have been logged for review.')
                        .setColor('#FF0000')
                        .setFooter({ text: 'Error ID: ' + Date.now() })
                        .setTimestamp();

                    await safeReply(interaction, {
                        embeds: [errorEmbed],
                        ephemeral: true
                    });
                } catch (e) {
                    console.error('Failed to notify user of error:', e);
                }
            }
            
            return null;
        }
    }

    static async logError(userId, username, error) {
        try {
            const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
            if (!logChannel) return;

            const errorEmbed = new EmbedBuilder()
                .setTitle('⚠️ User Error Logged')
                .setDescription(`User **${username}** (${userId}) encountered an error`)
                .addFields(
                    { name: '❌ Error Message', value: error.message.substring(0, 1024), inline: false },
                    { name: '📍 Stack Trace', value: `\`\`\`${error.stack?.substring(0, 500) || 'No stack trace'}\`\`\``, inline: false },
                    { name: '⏰ Time', value: new Date().toLocaleString('it-IT'), inline: true },
                    { name: '🆔 Error ID', value: Date.now().toString(), inline: true }
                )
                .setColor('#FF0000')
                .setTimestamp();

            await logChannel.send({ embeds: [errorEmbed] });
        } catch (e) {
            console.error('Failed to log error to channel:', e);
        }
    }
}