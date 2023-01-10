import { useRef, useEffect } from "react";
import videojs from "video.js";
import "../videojs/nuevo.js";
import "../videojs/plugins/thumbnails.js";
import "../videojs/plugins/hotkeys.js";

export default function IndexPage() {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      // Assign skin name before the player is initialized
      videojs.skin("shaka");

      // Initialize player
      const player = videojs(videoRef.current, {
        fluid: true,
        poster: "//cdnzone.nuevodevel.com/images/coffee.jpg",
        sources: [
          {
            src: "//cdnzone.nuevodevel.com/video/hls/coffee/playlist.m3u8",
            type: "application/x-mpegURL",
          },
        ],
        playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      });
      player.on("ready", function () {
        // load VTT Thumbnails when player is ready
        var track = [{
            kind: "captions",
            src: "//cdnzone.nuevodevel.com/video/hls/tears/captions/steal_en.vtt",
            srlang: "en",
            label: "English",
            default: "1"
        },
        {
            kind: "captions",
            src: "//cdnzone.nuevodevel.com/video/hls/tears/captions/steal_de.vtt",
            srlang: "de",
            label: "German"
        },
        {
            kind: "captions",
            src: "//cdnzone.nuevodevel.com/video/hls/tears/captions/steal_fr.vtt",
            srlang: "fr",
            label: "French"
        },
        {
            kind: "captions",
            src: "//cdnzone.nuevodevel.com/video/hls/tears/captions/steal_es.vtt",
            srlang: "es",
            label: "Spanish"
        },
        {
            kind: "metadata",
            src: "https://cdn.nuevodevel.com/media/coffee2.vtt?tm=22",
        }];
        this.loadTracks(track);
        this.textTracksStyle({backgroundOpacity: 0.5, fontPercent: 1, edgeStyle: "none"});

        console.log("Player ready!");
      });
      // Initialize Nuevo plugin
      player.nuevo({
        videoInfo: true,
        infoText: "Video Title Goes Here",
        infoDescription: "Subtitle for video goes here if necessary",
        qualityMenu: true,
        pipButton: false,
        shareMenu: false,
        zoomMenu: false,
        ccButton: true,
        buttonRewind: false,
      });
      player.thumbnails();
      player.hotkeys({
        volumeStep: 0.1,
        seekStep: 5,
      });
    }
  });

  return (
    <div>
      <div className="container">
        <video controls ref={videoRef} className="video-js tenami-player" />
      </div>
    </div>
  );
}