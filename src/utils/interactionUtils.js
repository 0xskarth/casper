// ========================================
// INTERACTION UTILITIES - Safe Interaction Functions
// ========================================

const InteractionValidator = require('../core/InteractionValidator');

async function safeReply(interaction, options, retries = 3) {
    // Force ephemeral sempre
    if (options.ephemeral === undefined) {
        options.ephemeral = true;
    }

    // Check timeout con log dettagliato
    if (!await InteractionValidator.canRespond(interaction)) {
        const age = Date.now() - interaction.createdTimestamp;
        console.log(`[SAFE_REPLY] ⏱️ Interaction too old (${age}ms), skipping reply`);
        return null;
    }

    for (let i = 0; i < retries; i++) {
        try {
            if (!await InteractionValidator.canRespond(interaction)) {
                console.log('[INTERACTION] Interaction expired during retry');
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
                console.log('[INTERACTION] Interaction expired (10062)');
                return null;
            }
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    return null;
}

async function safeUpdate(interaction, options, retries = 3) {
    // Force ephemeral sempre
    if (options.ephemeral === undefined) {
        options.ephemeral = true;
    }

    if (!await InteractionValidator.canRespond(interaction)) {
        return null;
    }

    for (let i = 0; i < retries; i++) {
        try {
            if (!await InteractionValidator.canRespond(interaction)) {
                console.log('[INTERACTION] Interaction expired during retry');
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
                console.log('[INTERACTION] Interaction expired (10062)');
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
