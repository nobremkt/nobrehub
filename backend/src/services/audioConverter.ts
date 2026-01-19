// Audio Converter Service - Converts webm to MP3 for WhatsApp compatibility
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { Readable, PassThrough } from 'stream';
import { promisify } from 'util';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

/**
 * Converts audio buffer from webm to MP3 format
 * WhatsApp only accepts: audio/ogg; codecs=opus, audio/mpeg, audio/amr, audio/mp4, audio/aac
 */
export async function convertAudioToMp3(inputBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        // Create readable stream from buffer
        const inputStream = new Readable();
        inputStream.push(inputBuffer);
        inputStream.push(null);

        // Create output stream
        const outputStream = new PassThrough();

        outputStream.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });

        outputStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });

        outputStream.on('error', (err) => {
            reject(err);
        });

        // Run ffmpeg conversion
        ffmpeg(inputStream)
            .inputFormat('webm')
            .audioCodec('libmp3lame')
            .audioBitrate('64k')
            .audioChannels(1)
            .audioFrequency(22050)
            .format('mp3')
            .on('error', (err: Error) => {
                console.error('FFmpeg conversion error:', err);
                reject(err);
            })
            .on('end', () => {
                console.log('✅ Audio conversion completed');
            })
            .pipe(outputStream, { end: true });
    });
}

/**
 * Checks if audio needs conversion (webm format)
 */
export function needsConversion(mimeType: string): boolean {
    return mimeType.includes('webm');
}
