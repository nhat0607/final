const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const archiver = require('archiver');
const unzipper = require('unzipper');
const BSON = require('bson');

exports.backupMongoDB = async (req, res) => {
    try {
        const backupDir = path.resolve(__dirname, '../../backup');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveFilename = `backup-${timestamp}.zip`;

        const existingFiles = fs.readdirSync(backupDir);
        existingFiles.forEach(file => {
            if (file.startsWith('backup-') && file.endsWith('.zip')) {
                fs.rmSync(path.join(backupDir, file));
            }
        });

        const dumpDir = path.join(backupDir, `backup-${timestamp}`);
        if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir);

        const dumpCommand = `mongodump --uri="mongodb://localhost:27017/PBL6" --out="${dumpDir}"`;
        await new Promise((resolve, reject) => {
            exec(dumpCommand, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        const output = fs.createWriteStream(path.join(backupDir, archiveFilename));
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.pipe(output);
        archive.directory(dumpDir, false);
        await archive.finalize();

        fs.rmSync(dumpDir, { recursive: true, force: true });

        res.status(200).json({ message: 'Backup successful', file: archiveFilename });
    } catch (error) {
        res.status(500).json({ message: 'Backup failed', error: error.message });
    }
};

exports.restoreMongoDB = async (req, res) => {
    try {
        const backupDir = path.join(__dirname, '../../backup'); 
        console.log(`Checking backup directory: ${backupDir}`);
        const existingFiles = fs.readdirSync(backupDir);
        console.log(`Files found in backup directory: ${existingFiles.join(', ')}`);
        
        const latestBackupFile = existingFiles
            .filter(file => file.startsWith('backup-') && file.endsWith('.zip'))
            .sort((a, b) => b.localeCompare(a))[0];

        if (!latestBackupFile) {
            console.log('No backup file found');
            return res.status(400).json({ message: 'No backup file found' });
        }

        console.log(`Using backup file: ${latestBackupFile}`);

        const fixedTempDir = path.join(__dirname, '../../temp/restore-fixed');
        console.log(`Using fixed temporary directory: ${fixedTempDir}`);

        if (fs.existsSync(fixedTempDir)) {
            console.log(`Cleaning up existing folder: ${fixedTempDir}`);
            fs.rmSync(fixedTempDir, { recursive: true, force: true });
        }

        fs.mkdirSync(fixedTempDir, { recursive: true });
        console.log('Fixed temporary directory created.');

        console.log(`Extracting backup file ${latestBackupFile} to ${fixedTempDir}`);
        await fs.createReadStream(path.join(backupDir, latestBackupFile))
            .pipe(unzipper.Extract({ path: fixedTempDir })).promise();

        const extractedFiles = fs.readdirSync(fixedTempDir);
        console.log(`Files in fixed temporary directory after extraction: ${extractedFiles.join(', ')}`);

        const backupFolder = extractedFiles.find((folder) => folder === 'PBL6');
        console.log(`Found backup folder: ${backupFolder}`);
        
        if (!backupFolder) {
            console.log('Backup structure is invalid or missing the required folder.');
            throw new Error('Invalid backup structure.');
        }

        const restorePath = path.join(fixedTempDir, backupFolder);
        console.log(`Restore path: ${restorePath}`);

        const restoreCommand = `mongorestore --uri="mongodb://localhost:27017/PBL6" --drop ${restorePath}`;
        console.log(`Running restore command: ${restoreCommand}`);
        
        await new Promise((resolve, reject) => {
            exec(restoreCommand, (err) => {
                if (err) {
                    console.log('Error during mongorestore execution:', err);
                    return reject(err);
                }
                resolve();
            });
        });

        console.log('Restore completed successfully');
        res.status(200).json({ message: 'Restore successful' });

    } catch (error) {
        console.error('Error during restore process:', error);
        res.status(500).json({ message: 'Restore failed', error: error.message });
    }
};

exports.sendemail = async (req, res) => {

}
