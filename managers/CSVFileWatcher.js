// ========================================
// CSV FILE WATCHER
// ========================================
class CSVFileWatcher extends EventEmitter {
    constructor() {
        super();
        this.dataPath = './data';
        this.fileHashes = new Map();
        this.watcher = null;
        this.checkInterval = null;
    }

    async init() {
        await fs.ensureDir(this.dataPath);
        await this.loadInitialHashes();
        this.startWatching();
        this.startPeriodicCheck();
        console.log('📁 CSV File Watcher initialized');
    }

    async loadInitialHashes() {
        const files = await fs.readdir(this.dataPath);
        for (const file of files) {
            if (file.endsWith('.csv') || file.endsWith('.txt')) {
                const filePath = path.join(this.dataPath, file);
                const hash = await this.getFileHash(filePath);
                this.fileHashes.set(file, hash);
                console.log(`[DEBUG] Initial hash for ${file}: ${hash?.substring(0, 8)}`);
            }
        }
    }

    async getFileHash(filePath) {
        try {
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf-8');
            const hash = crypto.createHash('md5')
                .update(content)
                .update(stats.mtime.toISOString())
                .digest('hex');
            return hash;
        } catch (error) {
            return null;
        }
    }

    startWatching() {
        this.watcher = chokidar.watch([
            path.join(this.dataPath, '*.csv'),
            path.join(this.dataPath, '*.txt')
        ], {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        this.watcher.on('add', async (filePath) => {
            const fileName = path.basename(filePath);
            console.log(`[CSV_UPDATE] 📄 New file detected: ${fileName}`);
            await logToChannel(null, {
                title: '📄 CSV Update',
                description: `New file detected: **${fileName}**`,
                color: '#00FFFF'
            });
            this.emit('csv-added', fileName);
            await this.updateFileHash(fileName);
        });

        this.watcher.on('change', async (filePath) => {
            const fileName = path.basename(filePath);
            const oldHash = this.fileHashes.get(fileName);
            const newHash = await this.getFileHash(filePath);
            
            if (oldHash !== newHash) {
                console.log(`[CSV_UPDATE] 📝 File updated: ${fileName}`);
                await logToChannel(null, {
                    title: '📝 CSV Update',
                    description: `File updated: **${fileName}**`,
                    fields: [
                        { name: 'Old Hash', value: oldHash?.substring(0, 8) || 'N/A', inline: true },
                        { name: 'New Hash', value: newHash?.substring(0, 8) || 'N/A', inline: true }
                    ],
                    color: '#00FFFF'
                });
                this.emit('csv-updated', fileName);
                this.fileHashes.set(fileName, newHash);
            }
        });

        this.watcher.on('unlink', async (filePath) => {
            const fileName = path.basename(filePath);
            console.log(`[CSV_UPDATE] 🗑️ File removed: ${fileName}`);
            await logToChannel(null, {
                title: '🗑️ CSV Removed',
                description: `File removed: **${fileName}**`,
                color: '#FF0000'
            });
            this.emit('csv-removed', fileName);
            this.fileHashes.delete(fileName);
        });
    }

    startPeriodicCheck() {
        this.checkInterval = setInterval(async () => {
            await this.checkAllFiles();
        }, 600000);
    }

    async checkAllFiles() {
        console.log('[DEBUG] 🔍 Performing periodic CSV check');
        const files = await fs.readdir(this.dataPath);
        const csvFiles = files.filter(f => f.endsWith('.csv') || f.endsWith('.txt'));
        let changedCount = 0;

        for (const file of csvFiles) {
            const filePath = path.join(this.dataPath, file);
            const currentHash = await this.getFileHash(filePath);
            const storedHash = this.fileHashes.get(file);

            if (currentHash !== storedHash) {
                changedCount++;
                console.log(`[CSV_UPDATE] 📝 Detected change in ${file} during periodic check`);
                this.emit('csv-updated', file);
                this.fileHashes.set(file, currentHash);
            }
        }

        if (changedCount > 0) {
            console.log(`[INFO] ✅ Periodic check complete: ${changedCount} files updated`);
            await logToChannel(null, {
                title: '🔍 Periodic Check Complete',
                description: `Updated ${changedCount} files`,
                color: '#00FF00'
            });
        }
    }

    async updateFileHash(fileName) {
        const filePath = path.join(this.dataPath, fileName);
        const hash = await this.getFileHash(filePath);
        this.fileHashes.set(fileName, hash);
    }

    stop() {
        if (this.watcher) {
            this.watcher.close();
        }
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        console.log('[INFO] 🛑 CSV File Watcher stopped');
    }
}