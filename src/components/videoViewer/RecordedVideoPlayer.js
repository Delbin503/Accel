import React from 'react';
import ReactPlayer from 'react-player';

/**
 * RecordedVideoPlayer Component
 * Plays recorded MP4 videos with full or limited controls
 *
 * @param {string} videoUrl - Required: URL to the video file (MP4, HLS, etc.)
 * @param {string} thumbnail - Optional: Poster/thumbnail image URL
 * @param {boolean} playing - Auto-play state (default: false)
 * @param {boolean} controls - Show native browser controls (default: true)
 * @param {boolean} light - Thumbnail mode - shows poster until clicked (default: false)
 * @param {string} width - Player width (default: '100%')
 * @param {string} height - Player height (default: '100%')
 * @param {function} onProgress - Callback for playback progress
 * @param {function} onEnded - Callback when video ends
 * @param {function} onReady - Callback when player is ready
 * @param {function} onPlay - Callback when video starts playing
 * @param {function} onPause - Callback when video is paused
 * @param {object} config - Additional ReactPlayer configuration
 */
const RecordedVideoPlayer = ({
  videoUrl,
  thumbnail = null,
  playing = false,
  controls = true,
  light = false,
  width = '100%',
  height = '100%',
  muted = false,
  loop = false,
  volume = 0.8,
  playbackRate = 1.0,
  onProgress = () => {},
  onDuration = () => {},
  onEnded = () => {},
  onReady = () => {},
  onPlay = () => {},
  onPause = () => {},
  onSeek = () => {},
  className = '',
  style = {},
  config = {},
  ...props
}) => {
  // Default config with optional overrides
  const playerConfig = {
    file: {
      attributes: {
        poster: thumbnail || undefined,
        controlsList: 'nodownload', // Disable download button
        disablePictureInPicture: false,
        ...config?.file?.attributes,
      },
      ...config?.file,
    },
    ...config,
  };

  return (
    <div
      className={`recorded-video-player ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000',
        borderRadius: '8px',
        ...style
      }}
    >
      <ReactPlayer
        url={videoUrl}
        playing={playing}
        controls={controls}
        light={light ? (thumbnail || true) : false}
        width={width}
        height={height}
        muted={muted}
        loop={loop}
        volume={volume}
        playbackRate={playbackRate}
        onProgress={onProgress}
        onDuration={onDuration}
        onEnded={onEnded}
        onReady={onReady}
        onPlay={onPlay}
        onPause={onPause}
        onSeek={onSeek}
        config={playerConfig}
        {...props}
      />
    </div>
  );
};

export default RecordedVideoPlayer;
