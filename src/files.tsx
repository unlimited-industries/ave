const getVideoDimensions = (file: Blob): Promise<{width: number, height: number}> => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('video/')) {
            reject(new Error('Это не видео файл!'));
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

        video.addEventListener('error', (e) => {
            reject(new Error('Ошибка при загрузке видео.'));
        });
    });
}

export {getVideoDimensions}
