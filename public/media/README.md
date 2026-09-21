# Memories of Sivsha — Media Directory

This directory is the production destination for your real personal photos and videos.

## Subdirectories

- `photos/`: Place your personal JPEG/PNG/WebP images here (e.g. `train_sunset.jpg`, `beach_walk.jpg`, `home_tea.jpg`).
- `videos/`: Place short personal MP4/WebM clips here (e.g. `waves.mp4`, `bike_ride.mp4`).

## How to connect your photos to the story:

1. Copy your photo into `public/media/photos/my_photo.jpg`.
2. Open `src/lib/mediaRegistry.ts`.
3. In `PERSONAL_MEDIA_REGISTRY`, locate the milestone you want to update (e.g., `m-6` for Kozhikode Train, `m-7` for Beach, `m-12` for Home).
4. Set `personalUrl: "/media/photos/my_photo.jpg"`.
5. Run `npm run build`. The story frame will automatically load your personal photo with responsive scaling, error fallbacks, and lazy loading.
