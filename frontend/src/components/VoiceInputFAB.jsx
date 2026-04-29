import { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react'; // Better icons

// Updated to correct backend port
const API_BASE = `${import.meta.env.VITE_API_URL}/api/voice`;

export default function VoiceInputFAB({ onDataReceived, promptContext }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    // --- WAV Conversion Helpers ---
    const bufferToWav = (buffer) => {
        const numOfChan = 1; // Mono
        const length = buffer.length * numOfChan * 2 + 44;
        const outBuffer = new ArrayBuffer(length);
        const view = new DataView(outBuffer);
        const channels = [];
        let i;
        let sample;
        let offset = 0;
        let pos = 0;

        // Get channel data
        for (i = 0; i < buffer.numberOfChannels; i++)
            channels.push(buffer.getChannelData(i));

        // Write WAV Header
        setUint32(0x46464952); // "RIFF"
        setUint32(36 + buffer.length * 2); // file length - 8
        setUint32(0x45564157); // "WAVE"
        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(2 * numOfChan); // block-align
        setUint16(16); // 16-bit (hardcoded in this encoding)

        setUint32(0x61746164); // "data" - chunk
        setUint32(buffer.length * 2); // chunk length

        // Write interleaved data
        // For mono, it's just the one channel
        while (pos < buffer.length) {
            for (i = 0; i < numOfChan; i++) {
                // Mix keys if we had stereo to mono, but here we just take channel 0 or mix
                // Simple mono conversion: average if multiple channels, else just take 0
                sample = 0;
                for (let c = 0; c < buffer.numberOfChannels; c++) {
                    sample += channels[c][pos];
                }
                sample /= buffer.numberOfChannels;

                sample = Math.max(-1, Math.min(1, sample)); // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
                view.setInt16(44 + offset, sample, true);
                offset += 2;
            }
            pos++;
        }

        return new Blob([outBuffer], { type: "audio/wav" });

        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    };

    const convertToWav16kMono = async (audioBlob) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Resample if needed (OfflineAudioContext technique)
        const targetSampleRate = 16000;
        const offlineCtx = new OfflineAudioContext(1, audioBuffer.duration * targetSampleRate, targetSampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineCtx.destination);
        source.start(0);

        const resampledBuffer = await offlineCtx.startRendering();
        return bufferToWav(resampledBuffer);
    };
    // ----------------------------


    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream); // Let browser decide native mime
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                setIsProcessing(true); // START LOADER
                try {
                    // Create blob from chunks
                    const rawBlob = new Blob(chunksRef.current, { type: 'audio/webm' }); // Default assumption, but decodeAudioData handles most

                    // Convert to 16k Mono WAV
                    const wavBlob = await convertToWav16kMono(rawBlob);

                    await processAudio(wavBlob);

                } catch (conversionErr) {
                    console.error("Audio conversion error:", conversionErr);
                    alert("Failed to process audio on client.");
                } finally {
                    setIsProcessing(false); // STOP LOADER
                    // Stop all tracks to release mic
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please ensure permissions are granted.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const processAudio = async (blob) => {
        const formData = new FormData();
        formData.append('file', blob, 'recording.wav'); // Explicitly name it .wav

        // Pass the schema/context for accurate extraction
        formData.append('voice_schema', JSON.stringify(promptContext));

        try {
            const res = await fetch(`${API_BASE}/process`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Server error processing voice");
            }

            const data = await res.json();
            console.log("Voice Data:", data);
            if (onDataReceived) {
                onDataReceived(data);
            }
        } catch (err) {
            console.error(err);
            alert(`Failed to process voice command: ${err.message}`);
        }
    };

    const baseStyle = {
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '4rem',
        height: '4rem',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isRecording ? '0 0 0 4px rgba(239, 68, 68, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        backgroundColor: isRecording ? '#ef4444' : isProcessing ? '#9ca3af' : '#4f46e5',
        transform: (!isRecording && !isProcessing) ? 'scale(1)' : 'scale(1)', // Hover effect can be handled with onMouseEnter/Leave if strictly needed, or simple CSS class in App.css
        color: 'white'
    };

    return (
        <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            style={baseStyle}
            title={isRecording ? "Stop Recording" : "Voice Input"}
            onMouseOver={(e) => { if (!isRecording && !isProcessing) e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
            {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin" style={{ width: '2rem', height: '2rem', animation: 'spin 1s linear infinite' }} />
            ) : isRecording ? (
                <MicOff style={{ width: '2rem', height: '2rem' }} />
            ) : (
                <Mic style={{ width: '2rem', height: '2rem' }} />
            )}
            <style>
                {`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}
            </style>
        </button>
    );
}
