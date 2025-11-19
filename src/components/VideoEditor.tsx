import React, { useState, useEffect, useRef } from 'react';
import { ffmpegService } from '../utils/ffmpeg';
import {
    Box,
    Button,
    Card,
    CardContent,
    Slider,
    Typography,
    Stack,
    CircularProgress,
    LinearProgress,
    Paper,
    Alert
} from '@mui/material';
import {
    CloudUpload,
    PlayArrow,
    Download,
    ContentCut,
    BlurOn,
    Brightness6,
    Contrast,
    RotateRight,
    Image as ImageIcon,
    Bolt,
    Refresh
} from '@mui/icons-material';

export const VideoEditor: React.FC = () => {
    const [ready, setReady] = useState(false);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [processedUrl, setProcessedUrl] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    // Filter states
    const [blurAmount, setBlurAmount] = useState(0);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(10);
    const [duration, setDuration] = useState(0);

    // New Filters
    const [grayscale, setGrayscale] = useState(false);
    const [brightness, setBrightness] = useState(0); // -1.0 to 1.0
    const [contrast, setContrast] = useState(1); // 0.0 to 2.0 (1 is default)
    const [invert, setInvert] = useState(false);
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
    const [sepia, setSepia] = useState(false);
    const [reverse, setReverse] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            await ffmpegService.load();
            ffmpegService.onProgress(({ progress }) => {
                setProgress(Math.round(progress * 100));
            });
            ffmpegService.onLog(({ message }) => {
                setLogs(prev => [...prev.slice(-4), message]);
            });
            setReady(true);
        } catch (e) {
            console.error(e);
            setLogs(prev => [...prev, `Error loading FFmpeg: ${e}`]);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setVideoFile(file);
        setProcessedUrl(null);
        const url = URL.createObjectURL(file);
        setVideoUrl(url);

        // Reset filters
        setBlurAmount(0);
        setTrimStart(0);
        setGrayscale(false);
        setBrightness(0);
        setContrast(1);
        setInvert(false);
        setRotation(0);
        setSepia(false);
        setReverse(false);

        // Write file to memory
        const data = await fetchFile(file);
        await ffmpegService.writeFile('input.mp4', data);
    };

    const fetchFile = async (file: File): Promise<Uint8Array> => {
        return new Uint8Array(await file.arrayBuffer());
    };

    const onLoadedMetadata = () => {
        if (videoRef.current) {
            const dur = videoRef.current.duration;
            setDuration(dur);
            setTrimEnd(dur);
        }
    };

    const processVideo = async () => {
        if (!videoFile) return;
        setProcessing(true);
        setProcessedUrl(null);
        setProgress(0);

        try {
            const args = ['-i', 'input.mp4'];
            const videoFilters: string[] = [];
            const audioFilters: string[] = [];

            const hasVisualFilters = blurAmount > 0 || grayscale || brightness !== 0 || contrast !== 1 || invert || rotation !== 0 || sepia || reverse;

            if (trimStart > 0 || trimEnd < duration) {
                args.push('-ss', trimStart.toString());
                args.push('-to', trimEnd.toString());
            }

            if (!hasVisualFilters) {
                args.push('-c', 'copy');
            } else {
                if (blurAmount > 0) videoFilters.push(`boxblur=${blurAmount}:1`);
                if (grayscale) videoFilters.push('hue=s=0');
                if (sepia) videoFilters.push('colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131');
                if (brightness !== 0 || contrast !== 1) videoFilters.push(`eq=brightness=${brightness}:contrast=${contrast}`);
                if (invert) videoFilters.push('negate');
                if (rotation === 90) videoFilters.push('transpose=1');
                if (rotation === 180) videoFilters.push('transpose=1,transpose=1');
                if (rotation === 270) videoFilters.push('transpose=2');
                if (reverse) {
                    videoFilters.push('reverse');
                    audioFilters.push('areverse');
                }

                if (videoFilters.length > 0) {
                    args.push('-vf', videoFilters.join(','));
                }
                if (audioFilters.length > 0) {
                    args.push('-af', audioFilters.join(','));
                }

                args.push('-preset', 'ultrafast');
            }

            args.push('output.mp4');

            await ffmpegService.exec(args);

            const data = await ffmpegService.readFile('output.mp4');
            const url = URL.createObjectURL(new Blob([data as any], { type: 'video/mp4' }));
            setProcessedUrl(url);
        } catch (error) {
            console.error(error);
            setLogs(prev => [...prev, `Error processing: ${error}`]);
        } finally {
            setProcessing(false);
        }
    };

    const rotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto' }}>
            {!ready ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10 }}>
                    <CircularProgress size={60} />
                    <Typography variant="h6" sx={{ mt: 2 }}>Loading FFmpeg Core...</Typography>
                </Box>
            ) : (
                <>
                    {!videoUrl ? (
                        <Card sx={{ mt: 4, p: 4, borderStyle: 'dashed', borderWidth: 2, borderColor: 'text.secondary' }}>
                            <Box
                                component="label"
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    '&:hover': { opacity: 0.8 }
                                }}
                            >
                                <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h5" gutterBottom>Click to Upload Video</Typography>
                                <Typography variant="body2" color="text.secondary">Select an MP4 file to edit</Typography>
                                <input type="file" accept="video/mp4,video/x-m4v,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            </Box>
                        </Card>
                    ) : (
                        <Stack spacing={3}>
                            <Card sx={{ overflow: 'hidden', bgcolor: 'black' }}>
                                <Box sx={{ position: 'relative', width: '100%', maxHeight: '60vh', display: 'flex', justifyContent: 'center' }}>
                                    <video
                                        ref={videoRef}
                                        src={processedUrl || videoUrl}
                                        controls
                                        onLoadedMetadata={onLoadedMetadata}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '60vh',
                                            transform: processedUrl ? 'none' : `rotate(${rotation}deg)`,
                                            filter: processedUrl ? 'none' : `
                        blur(${blurAmount}px) 
                        grayscale(${grayscale ? 1 : 0}) 
                        sepia(${sepia ? 1 : 0}) 
                        brightness(${1 + brightness}) 
                        contrast(${contrast}) 
                        invert(${invert ? 1 : 0})
                      `
                                        }}
                                    />
                                </Box>
                            </Card>

                            <Card>
                                <CardContent>
                                    <Stack spacing={4}>
                                        {/* Trim Controls */}
                                        <Box>
                                            <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ContentCut fontSize="small" /> Trim ({trimStart}s - {trimEnd}s)
                                            </Typography>
                                            <Slider
                                                value={[trimStart, trimEnd]}
                                                min={0}
                                                max={duration}
                                                step={0.1}
                                                onChange={(_, newValue) => {
                                                    const [start, end] = newValue as number[];
                                                    setTrimStart(start);
                                                    setTrimEnd(end);
                                                }}
                                                valueLabelDisplay="auto"
                                                disableSwap
                                            />
                                        </Box>

                                        {/* Filters Grid */}
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
                                            <Box>
                                                <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <BlurOn fontSize="small" /> Blur Intensity: {blurAmount}
                                                </Typography>
                                                <Slider
                                                    value={blurAmount}
                                                    min={0}
                                                    max={20}
                                                    onChange={(_, val) => setBlurAmount(val as number)}
                                                />
                                            </Box>

                                            <Box>
                                                <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Brightness6 fontSize="small" /> Brightness: {brightness}
                                                </Typography>
                                                <Slider
                                                    value={brightness}
                                                    min={-1}
                                                    max={1}
                                                    step={0.1}
                                                    onChange={(_, val) => setBrightness(val as number)}
                                                />
                                            </Box>

                                            <Box>
                                                <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Contrast fontSize="small" /> Contrast: {contrast}
                                                </Typography>
                                                <Slider
                                                    value={contrast}
                                                    min={0}
                                                    max={2}
                                                    step={0.1}
                                                    onChange={(_, val) => setContrast(val as number)}
                                                />
                                            </Box>

                                            {/* Toggles */}
                                            <Box>
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    <Button
                                                        variant={grayscale ? "contained" : "outlined"}
                                                        onClick={() => setGrayscale(!grayscale)}
                                                        startIcon={<ImageIcon />}
                                                        size="small"
                                                    >
                                                        Grayscale
                                                    </Button>
                                                    <Button
                                                        variant={sepia ? "contained" : "outlined"}
                                                        onClick={() => setSepia(!sepia)}
                                                        startIcon={<ImageIcon />}
                                                        size="small"
                                                    >
                                                        Sepia
                                                    </Button>
                                                    <Button
                                                        variant={invert ? "contained" : "outlined"}
                                                        onClick={() => setInvert(!invert)}
                                                        startIcon={<Bolt />}
                                                        size="small"
                                                    >
                                                        Invert
                                                    </Button>
                                                    <Button
                                                        variant={reverse ? "contained" : "outlined"}
                                                        onClick={() => setReverse(!reverse)}
                                                        startIcon={<PlayArrow sx={{ transform: 'scaleX(-1)' }} />}
                                                        size="small"
                                                    >
                                                        Reverse
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        onClick={rotate}
                                                        startIcon={<RotateRight />}
                                                        size="small"
                                                    >
                                                        Rotate ({rotation}°)
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        </Box>
                                    </Stack>

                                    {/* Actions */}
                                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={processVideo}
                                            disabled={processing}
                                            startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                                        >
                                            {processing ? 'Processing...' : 'Apply Filters'}
                                        </Button>

                                        {processedUrl && (
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                size="large"
                                                href={processedUrl}
                                                download="edited_video.mp4"
                                                startIcon={<Download />}
                                            >
                                                Download
                                            </Button>
                                        )}

                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={() => {
                                                setVideoUrl(null);
                                                setVideoFile(null);
                                                setProcessedUrl(null);
                                            }}
                                            startIcon={<Refresh />}
                                        >
                                            Reset
                                        </Button>
                                    </Stack>

                                    {processing && (
                                        <Box sx={{ width: '100%', mt: 2 }}>
                                            <LinearProgress variant="determinate" value={progress} />
                                            <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
                                                {progress}% Complete
                                            </Typography>
                                            {reverse && (
                                                <Alert severity="info" sx={{ mt: 1 }}>
                                                    Reverse playback requires buffering the entire video. This may take a while and appear stuck at 0%.
                                                </Alert>
                                            )}
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>

                            {logs.length > 0 && (
                                <Paper sx={{ p: 2, bgcolor: 'black', color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.8rem', maxHeight: 150, overflowY: 'auto' }}>
                                    {logs.map((log, i) => <div key={i}>{log}</div>)}
                                </Paper>
                            )}
                        </Stack>
                    )}
                </>
            )}
        </Box>
    );
};
