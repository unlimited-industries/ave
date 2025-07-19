const getVideoDimensions = (file) => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('video/')) {
            reject(new Error('Not a video!'));
            return;
        }

        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);

        video.addEventListener('loadedmetadata', () => {
            const width = video.videoWidth;
            const height = video.videoHeight;

            URL.revokeObjectURL(video.src);

            resolve({ width, height });
        });

        video.addEventListener('error', () => {
            reject(new Error('Error loading video!'));
        });
    });
}

export { getVideoDimensions }
