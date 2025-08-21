import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { Command } from 'commander';

const execAsync = promisify(exec);

interface Options {
    verbose: boolean;
    videosDir: string;
    montageIntervalSeconds: number;
    tile: string;
}

let options: Options;

async function generateThumbnail(videoPath: string): Promise<void> {
    const dir = path.dirname(videoPath);
    const name = path.basename(videoPath, path.extname(videoPath));
    const outputPath = path.join(dir, `${name}_summary.jpg`);
    
    if (fs.existsSync(outputPath)) {
        if (options.verbose) {
            console.log(chalk.yellow(`⏭️  Skipping (thumbnail exists): ${videoPath}`));
        }
        return;
    }
    
    const samplingDuration = 750; // 12.5 minutes
    const command = `ffmpeg -i "${videoPath}" -vf "select='lte(t,${samplingDuration})*not(mod(t,${options.montageIntervalSeconds}))',scale=320:-1,tile=${options.tile}" -frames:v 1 "${outputPath}"`;
    
    try {
        console.log(chalk.blue(`🎬 Generating thumbnail for: ${videoPath}`));
        if (options.verbose) {
            console.log(chalk.gray(`Command: ${command}`));
        }
        await execAsync(command);
        console.log(chalk.green(`✅ Thumbnail created: ${outputPath}`));
    } catch (error) {
        console.error(chalk.red(`❌ Error generating thumbnail for ${videoPath}:`), error);
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
                if (options.verbose) {
                    console.log(chalk.gray(`📁 Entering directory: ${fullPath}`));
                }
                await processDirectory(fullPath);
            } else if (entry.isFile() && await isVideoFile(fullPath)) {
                await generateThumbnail(fullPath);
            }
        }
    } catch (error) {
        console.error(chalk.red(`❌ Error processing directory ${dirPath}:`), error);
    }
}

async function run(opts: Options): Promise<void> {
    options = opts;
    
    if (!fs.existsSync(options.videosDir)) {
        console.error(chalk.red(`❌ Target directory does not exist: ${options.videosDir}`));
        process.exit(1);
    }
    
    console.log(chalk.cyan(`🚀 Processing videos in: ${options.videosDir}`));
    if (options.verbose) {
        console.log(chalk.gray(`Settings: interval=${options.montageIntervalSeconds}s, tile=${options.tile}`));
    }
    await processDirectory(options.videosDir);
    console.log(chalk.green('🎉 Processing complete'));
}

if (require.main === module) {
    const program = new Command();
    
    program
        .name('samples-thumbnail-generator')
        .description('Generate video thumbnail montages recursively from MP4 and MKV files')
        .version('1.0.0')
        .option('-v, --verbose', 'show detailed output including ffmpeg commands and directory navigation')
        .option('-d, --videos-dir <path>', 'directory containing videos to process', '/mnt/o/_obs/_test')
        .option('--montage-interval-seconds <number>', 'interval between sampled frames in seconds', '30')
        .option('--tile <string>', 'tile grid format for thumbnail layout (e.g., 5x5, 4x4, 6x3)', '5x5')
        .addHelpText('after', `
Examples:
  $ node samples-thumbnail-generator.js
    Process videos in default directory with 30s intervals and 5x5 grid

  $ node samples-thumbnail-generator.js -v -d /path/to/videos
    Process videos in custom directory with verbose output

  $ node samples-thumbnail-generator.js --montage-interval-seconds 15 --tile 4x4
    Use 15-second intervals with 4x4 thumbnail grid

  $ node samples-thumbnail-generator.js -d ~/Videos --verbose
    Process ~/Videos directory with detailed logging

Notes:
  • Samples first 12.5 minutes (750 seconds) of each video
  • Creates thumbnails named {filename}_summary.jpg
  • Skips existing thumbnails (re-run safe)
  • Processes .mp4 and .mkv files recursively
  • Requires ffmpeg to be installed and available in PATH`)
        .action((opts) => {
            const options: Options = {
                verbose: opts.verbose,
                videosDir: opts.videosDir,
                montageIntervalSeconds: parseInt(opts.montageIntervalSeconds),
                tile: opts.tile
            };
            run(options).catch(console.error);
        });
    
    program.parse();
}