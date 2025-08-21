import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const targetDir = "/mnt/o/_obs/_test";

async function generateThumbnail(videoPath: string): Promise<void> {
    const dir = path.dirname(videoPath);
    const name = path.basename(videoPath, path.extname(videoPath));
    const outputPath = path.join(dir, `${name}_summary.jpg`);
    
    if (fs.existsSync(outputPath)) {
        console.log(`Skipping (thumbnail exists): ${videoPath}`);
        return;
    }
    
    const command = `ffmpeg -i "${videoPath}" -vf "select='lte(t,750)*not(mod(t,30))',scale=320:-1,tile=5x5" -frames:v 1 "${outputPath}"`;
    
    try {
        console.log(`Generating thumbnail for: ${videoPath}`);
        await execAsync(command);
        console.log(`Thumbnail created: ${outputPath}`);
    } catch (error) {
        console.error(`Error generating thumbnail for ${videoPath}:`, error);
    }
}

async function isVideoFile(filePath: string): Promise<boolean> {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.mp4' || ext === '.mkv';
}

async function processDirectory(dirPath: string): Promise<void> {
    try {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
                await processDirectory(fullPath);
            } else if (entry.isFile() && await isVideoFile(fullPath)) {
                await generateThumbnail(fullPath);
            }
        }
    } catch (error) {
        console.error(`Error processing directory ${dirPath}:`, error);
    }
}

async function main() {
    if (!fs.existsSync(targetDir)) {
        console.error(`Target directory does not exist: ${targetDir}`);
        process.exit(1);
    }
    
    console.log(`Processing videos in: ${targetDir}`);
    await processDirectory(targetDir);
    console.log('Processing complete');
}

if (require.main === module) {
    main().catch(console.error);
}