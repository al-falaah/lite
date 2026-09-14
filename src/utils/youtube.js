// Build a privacy-enhanced, minimally-branded YouTube embed URL.
//
// NOTE on branding: YouTube's ToS require their branding on the embed player,
// so the "Watch on YouTube" pill, the YouTube logo, and the thumbnail play
// button CANNOT be removed. These params only reduce the surrounding clutter:
//   - youtube-nocookie.com  : privacy-enhanced mode (no cookies until play)
//   - rel=0                 : end-screen "related" videos come from our channel
//                             only, not random unrelated videos
//   - modestbranding=1      : trims some chrome (limited effect, harmless)
//   - playsinline=1         : plays inline on iOS instead of forcing fullscreen
//   - color=white           : white progress bar instead of red
// For a fully brand-free player we'd need to host the video off YouTube
// (Vimeo, Cloudflare Stream, or a self-hosted MP4).
export const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([\w-]+)/);
  if (!match) return null;
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    color: 'white',
  });
  return `https://www.youtube-nocookie.com/embed/${match[1]}?${params.toString()}`;
};
