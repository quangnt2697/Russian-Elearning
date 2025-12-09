import React, { useState, useRef } from 'react';
import { Mic, StopCircle, Trash2 } from 'lucide-react';

const AudioRecorder = ({ onAudioReady }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const mediaRecorderRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorderRef.current.ondataavailable = e => chunks.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                if (onAudioReady) onAudioReady(blob);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            alert("Lỗi Microphone: " + err.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
        setIsRecording(false);
    };

    const clearRecording = () => {
        setAudioUrl(null);
        if (onAudioReady) onAudioReady(null);
    };

    return (
        <div className="mb-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <p className="mb-4 font-bold text-gray-700">Ghi âm câu trả lời của bạn</p>
            <div className="flex flex-col items-center gap-4">
                {!isRecording ? (
                    <div className="flex gap-4">
                        <button onClick={startRecording} className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 group">
                            <Mic size={32} className="group-hover:animate-pulse"/>
                        </button>
                        {audioUrl && (
                            <button onClick={clearRecording} className="bg-gray-200 hover:bg-gray-300 text-gray-600 p-4 rounded-full shadow-md transition-colors">
                                <Trash2 size={24} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-pulse text-red-500 font-bold text-sm">Đang ghi âm...</div>
                        <button onClick={stopRecording} className="bg-gray-800 hover:bg-black text-white p-4 rounded-full shadow-lg animate-pulse">
                            <StopCircle size={32} />
                        </button>
                    </div>
                )}

                {audioUrl && (
                    <div className="w-full mt-2 p-2 bg-gray-100 rounded-lg">
                        <audio controls src={audioUrl} className="w-full h-8" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudioRecorder;