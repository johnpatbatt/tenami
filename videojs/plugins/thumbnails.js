import videojs from "video.js";

// Default options for the plugin.
const defaults = {
  width: 160,
  height: 90,
  basePath: "",
  src: "",
};

const onPlayerReady = (player, options) => {
  function parseImageLink(imglocation) {
    var lsrc, hashindex, hashstring;
    hashindex = imglocation.indexOf("#");
    if (hashindex === -1) {
      return { src: imglocation, w: 0, h: 0, x: 0, y: 0 };
    }
    lsrc = imglocation.substring(0, hashindex);
    hashstring = imglocation.substring(hashindex + 1);
    if (hashstring.substring(0, 5) !== "xywh=") {
      return { src: defaults.basePath + lsrc, w: 0, h: 0, x: 0, y: 0 };
    }
    var data = hashstring.substring(5).split(",");
    return {
      src: defaults.basePath + lsrc,
      w: parseInt(data[2], 10),
      h: parseInt(data[3], 10),
      x: parseInt(data[0], 10),
      y: parseInt(data[1], 10),
    };
  }

  defaults.basePath = "";
  var div,
    t_img,
    canva,
    thumbposter,
    progressControl,
    progressHolder,
    duration,
    moveListener,
    moveCancel,
    thumbTrack,
    vttCues;

  if (options.basePath !== "") defaults.basePath = options.basePath;
  if (options.width && options.height) {
    defaults.width = options.width;
    defaults.height = options.height;
  }
  var settings = options;

  player.on("medialoaded", function (event) {
    player.sprite = false;

    var numtracks = player.textTracks().length;

    if (numtracks === 0) {
      if (div) videojs.dom.addClass("div", "vjs-hidden");
      return;
    }
    var istrack = false;

    var i = 0;
    while (i < numtracks) {
      if (
        player.textTracks()[i].kind === "metadata" &&
        player.textTracks()[i].src
      ) {
        thumbTrack = player.textTracks()[i];
        istrack = true;
        if (thumbTrack.cues == null) return;
        var cnum = thumbTrack && thumbTrack.cues.length;

        vttCues = thumbTrack.cues;

        thumbTrack.mode = "hidden";
        break;
      }
      i++;
    }
    if (istrack !== true) {
      if (div) videojs.dom.addClass("div", "vjs-hidden");
      return;
    }

    if (cnum < 1) {
      //videojs.dom.addClass('div','vjs-hidden');
      return;
    }

    i = 0;
    player.sprite = true;

    progressControl = player.controlBar.progressControl;
    progressHolder = player.el_.querySelector(".vjs-progress-holder");

    // remove/add the thumbnail to the player

    var el3 = player.el_.querySelector(".vjs-thumb-tooltip");
    if (el3 !== null) el3.parentNode.removeChild(el3);
    var el2 = player.el_.querySelector(".vjs-thumb-image");
    if (el2 !== null) el2.parentNode.removeChild(el2);
    var el1 = player.el_.querySelector(".vjs-thumbnail-holder");
    if (el1 !== null) el1.parentNode.removeChild(el1);

    div = document.createElement("div");
    div.className = "vjs-thumbnail-holder";

    var tooltip = document.createElement("div");
    tooltip.className = "vjs-thumb-tooltip";
    t_img = document.createElement("img");
    t_img.className = "vjs-thumb-image";
    div.appendChild(t_img);

    div.appendChild(tooltip);

    progressControl.el().appendChild(div);

    if (player.shadowSlide) {
      var el_poster = player.el_.querySelector(".vjs-thumb-poster");
      if (!el_poster) {
        thumbposter = document.createElement("div");
        thumbposter.className = "vjs-thumb-poster";
        canva = document.createElement("canvas");
        thumbposter.appendChild(canva);
        player.el_.insertBefore(
          thumbposter,
          player.el_.querySelector(".vjs-poster")
        );
      }
    }

    duration = player.duration();

    // when the container is MP4
    player.on("durationchange", function (event) {
      duration = player.duration();
    });

    // when the container is HLS
    player.on("loadedmetadata", function (event) {
      duration = player.duration();
    });

    var ppr = this.el_.querySelector(".vjs-play-progress");
    var ttp = ppr.querySelector(".vjs-time-tooltip");
    if (ttp) videojs.dom.addClass(ttp, "vjs-abs-hidden");
    var mtp = progressControl.el().querySelector(".vjs-mouse-display");
    if (mtp) mtp.style.opacity = 0;

    function formTime(seconds, guide) {
      seconds = seconds < 0 ? 0 : seconds;
      let s = Math.floor(seconds % 60);
      let m = Math.floor((seconds / 60) % 60);
      let h = Math.floor(seconds / 3600);
      const gm = Math.floor((guide / 60) % 60);
      const gh = Math.floor(guide / 3600);
      if (isNaN(seconds) || seconds === Infinity) {
        h = m = s = "-";
      }
      h = h > 0 || gh > 0 ? h + ":" : "";
      m = ((h || gm >= 10) && m < 10 ? "0" + m : m) + ":";
      s = s < 10 ? "0" + s : s;
      return h + m + s;
    }

    moveListener = function (e) {
      e.preventDefault();
      //e.stopPropagation()

      duration = player.duration();

      var holder = progressControl.el().querySelector(".vjs-progress-holder");
      var prg = progressControl.el().querySelector(".vjs-play-progress");
      var rect = holder.getBoundingClientRect();

      var pagex = null;

      if (e.pageX) {
        pagex = e.pageX;
      } else if (e.changedTouches) {
        pagex = e.changedTouches[0].pageX || e.touches[0].clientX;
      }
      var left = pagex - rect.left;

      if (left === 0 && videojs.holderdown && prg.offsetWidth > 0) {
        //left=prg.offsetWidth;
      }
      if (left < 0) left = 0;
      if (left > holder.offsetWidth) left = holder.offsetWidth;
      //if(videojs.holderdown)
      //prg.style.width=left+'px';

      var percent = left / holder.offsetWidth;
      var mouseTime = percent * duration;
      //var tlp = mtp.querySelector('.vjs-time-tooltip');

      tooltip.innerHTML = formTime(mouseTime, duration);

      var cnum = vttCues.length;

      i = 0;
      var is_slide = false;
      while (i < cnum) {
        var ccue = vttCues[i];
        if (ccue.startTime <= mouseTime && ccue.endTime >= mouseTime) {
          is_slide = true;
          var vtt = parseImageLink(ccue.text);
          break;
        }
        i++;
      }

      //None found, so show nothing
      if (is_slide !== true) {
        div.classList.add("vjs-thumb-hidden");

        return;
      }
      div.classList.remove("vjs-thumb-hidden");

      //Changed image?

      if (t_img.src.indexOf(vtt.src) < 0) {
        t_img.src = vtt.src;
      }

      //Fall back to plugin defaults in case no height/width is specified
      if (vtt.w === 0) {
        vtt.w = settings.width;
        t_img.style.width = vtt.w + "px";
      }
      if (vtt.h === 0) {
        vtt.h = settings.height;
        t_img.style.height = vtt.h + "px";
      }

      //Set the container width/height if it changed
      if (div.style.width !== vtt.w || div.style.height !== vtt.h) {
        div.style.width = vtt.w + "px";
        div.style.height = vtt.h + "px";
      }
      //Set the image cropping
      t_img.style.left = -vtt.x + "px";
      t_img.style.top = -vtt.y + "px";
      //img.style.clip = 'rect('+ vtt.y+'px,'+( vtt.w+ vtt.x)+'px,'+( vtt.y+ vtt.h)+'px,'+ vtt.x+'px)';

      var width = vtt.w;
      var halfWidth = width / 2;
      var right = progressControl.el().offsetWidth;
      var holef = player.el_.querySelector(".vjs-progress-holder").offsetLeft;
      var halfWidth2 = halfWidth - holef;

      // make sure that the thumbnail doesn't fall off the right side of the left side of the player
      if (left + halfWidth + holef > right) {
        left = right - width;
      } else if (left < halfWidth2) {
        left = 0;
      } else {
        left = left - halfWidth2;
      }

      div.style.left = parseInt(left, 10) + "px";
      div.classList.add("vjs-thumb-show");

      if (videojs.holderdown && player.shadowSlide) {
        var el_poster = player.el_.querySelector(".vjs-thumb-poster");
        if (!el_poster) {
          thumbposter = document.createElement("div");
          thumbposter.className = "vjs-thumb-poster";
          canva = document.createElement("canvas");
          thumbposter.appendChild(canva);
          player.el_.insertBefore(
            thumbposter,
            player.el_.querySelector(".vjs-poster")
          );
        }

        var context = canva.getContext("2d");
        canva.width = player.el_.offsetWidth;
        canva.height = player.el_.offsetHeight;
        thumbposter.style.width = canva.width + "px";
        thumbposter.style.height = canva.height + "px";
        context.clearRect(0, 0, canva.width, canva.height);
        context.drawImage(
          t_img,
          vtt.x,
          vtt.y,
          vtt.w,
          vtt.h,
          0,
          0,
          canva.width,
          canva.height
        );
      }
    };
    var supportsPassive = false;
    var opts = Object.defineProperty({}, "passive", {
      get: function () {
        supportsPassive = true;
        return true;
      },
    });
    window.addEventListener("testPassive", null, opts);
    window.removeEventListener("testPassive", null, opts);

    function thumb_out() {
      div.classList.remove("vjs-thumb-show");
      if (player.shadowSlide) {
        thumbposter.removeAttribute("style");
        canva.width = 0;
        canva.height = 0;
      }
    }
    moveCancel = function (e) {
      if (videojs.holderdown !== true) {
        div.classList.remove("vjs-thumb-show");
      }
    };
    function slideup() {
      videojs.holderdown = false;
      document.removeEventListener("mousemove", moveListener);
      document.removeEventListener("mouseup", slideup);
      thumb_out();
    }

    function slidedown(e) {
      videojs.holderdown = true;
      document.addEventListener("mousemove", moveListener);
      document.addEventListener("mouseup", slideup);
      moveListener(e);
    }

    progressHolder.addEventListener("mousemove", moveListener);
    progressHolder.addEventListener("mouseleave", moveCancel);
    progressHolder.addEventListener("mousedown", slidedown);

    function slideend() {
      progressHolder.removeEventListener("touchmove", moveListener);
      progressHolder.removeEventListener("touchend", slideend);
      thumb_out();
    }

    function slidetouch(e) {
      videojs.holderdown = false;
      progressHolder.addEventListener("touchmove", moveListener);
      progressHolder.addEventListener("touchend", slideend);
    }

    progressHolder.addEventListener(
      "touchstart",
      slidetouch,
      supportsPassive ? { passive: false } : false
    );
  });
};

const thumbnails = function (options) {
  this.ready(() => {
    onPlayerReady(this, videojs.mergeOptions(defaults, options));
  });
};
const registerPlugin = videojs.registerPlugin || videojs.plugin;
// Register the plugin with video.js.
registerPlugin("thumbnails", thumbnails);

// Include the version number.
thumbnails.VERSION = "1.1";

export default thumbnails;
