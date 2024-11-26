export async function getUserAudioStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return stream;
    } catch (error) {
        console.error('Error accessing microphone:', error);
        throw new Error('Microphone access denied.');
    }
}
