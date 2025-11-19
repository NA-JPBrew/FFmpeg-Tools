import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export class FFmpegService {
    private ffmpeg: FFmpeg;
    private loaded: boolean = false;

    constructor() {
        this.ffmpeg = new FFmpeg();
    }

    async load() {
        if (this.loaded) return;

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

        await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        this.loaded = true;
    }

    get instance() {
        return this.ffmpeg;
    }

    isLoaded() {
        return this.loaded;
    }

    async writeFile(name: string, data: Uint8Array) {
        await this.ffmpeg.writeFile(name, data);
    }

    async readFile(name: string) {
        return await this.ffmpeg.readFile(name);
    }

    async exec(args: string[]) {
        return await this.ffmpeg.exec(args);
    }

    onProgress(callback: (progress: { progress: number; time: number }) => void) {
        this.ffmpeg.on('progress', callback);
    }

    onLog(callback: (log: { message: string }) => void) {
        this.ffmpeg.on('log', callback);
    }
}

export const ffmpegService = new FFmpegService();
