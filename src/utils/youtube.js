export const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};
