window.exportPlaylistTitles = {
  run: function () {
    const videos = this.videosAsJSON();

    let unavailableVideoIndicies = [];
    const numHidden = this.numberOfHiddenVideos();
    window.currentVideos = videos;
    if (numHidden > 0) {
      this.lastRunVideos = videos

      console.log(`%c${numHidden} videos are hidden. Click the "Show unavailable videos" button to run this again.`, "color:red")
      this.setupWaitForReload();
      return;
    } else {
      if (this.lastRunVideos.length > 0) {
        unavailableVideoIndicies = this.compareVideosWithPreviousRun(videos);
      }
    }

    const filename = this.filename(videos.length, unavailableVideoIndicies.length);

    this.download(JSON.stringify(videos), filename, 'text/javascript');

    this.exportFormattedVideoData(videos, unavailableVideoIndicies);
  },

  exportFormattedVideoData: function (videos, unavailableVideoIndicies) {
    const fileContents = [];
    const header = this.documentHeader(videos.length, unavailableVideoIndicies.length);
    const filename = this.filename(videos.length, unavailableVideoIndicies.length);

    fileContents.push(header);
    fileContents.push(this.documentKey());

    videos.forEach((video, index) => {
      const available = !!video["available"];
      const availability = available ? '' : 'UNAVAILABLE ';
      let channelLink;

      if (!!video["channelUrl"]) {
        channelLink = `[${video["channelTitle"]}](${video["channelUrl"]})`;
      } else {
        channelLink = video["channelTitle"];
      }

      let line = `${index + 1}: ${availability}[${video["videoTitle"]}](${video["videoUrl"]}) | ${channelLink}`;
      if (available) {
        line = `- [] **${line}**`;
      }

      if (!available) {
        fileContents.push("");
      }

      fileContents.push(line);
    });

    this.download(fileContents.join("\n"), filename, 'text/plain');
  },

  // Source: https://stackoverflow.com/questions/47942244/print-javascript-object-to-txt-file
  download: function (data, filename, type) {
    const file = new Blob([data], { type: type });
    if (window.navigator.msSaveOrOpenBlob) // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
      const a = document.createElement("a");
      const url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  },

  videosAsJSON: function () {
    const videos = [];
    const videosAndSections = document.querySelectorAll("div#contents div#meta, div#title.ytd-item-section-header-renderer");

    for (const [_, videoOrSection] of Object.entries(videosAndSections)) {
      if (videoOrSection.id === 'title') {
        break;
      }
      videos.push(this.videoData(videoOrSection));
    }

    return videos;
  },

  videoData: function (video) {
    const videoTitle = video.querySelector("#video-title").title;
    const videoUrl = video.querySelector("#video-title").href.split("&")[0];
    const channelLink = video.querySelector("#channel-name yt-formatted-string#text a");

    let channelTitle = null;
    let channelUrl = null;
    let available = false;

    if (channelLink) {
      channelTitle = video.querySelector("#channel-name a").text;
      channelUrl = video.querySelector("#channel-name a").href;
      available = true;
    } else {
      const hiddenChannelTitle = video.querySelector("#channel-name yt-formatted-string#text");
      channelTitle = hiddenChannelTitle.title;
    }

    const data = {
      videoTitle: videoTitle,
      videoUrl: videoUrl,
      channelTitle: channelTitle,
      channelUrl: channelUrl,
      available: available,
    }

    return data;
  },

  interval: null,

  setupWaitForReload: function () {
    this.interval = setInterval(() => {
      const alert = document.querySelector("div#alerts yt-formatted-string");
      if (alert.innerText === "Unavailable videos will be hidden during playback") {
        clearInterval(this.interval);
        this.run();
      }
    }, 500);
  },

  lastRunVideos: [],

  // Given the current list of videos, compare with the previous run and determine which ones are unavailable
  compareVideosWithPreviousRun: function (currentVideos) {
    const previousVideos = this.lastRunVideos;
    const unavailableVideoIndicies = [];

    const endIndex = Math.max(previousVideos.length, currentVideos.length);
    let index1 = 0;
    let index2 = 0;

    while (index1 < endIndex && index2 < endIndex) {
      const v1 = previousVideos[index1];
      const v2 = currentVideos[index2];

      if (v1["videoUrl"] !== v2["videoUrl"]) {
        v2["available"] = false;
        unavailableVideoIndicies.push(index2);
        index2++;
      } else {
        v2["available"] = true;
        index1++;
        index2++;
      }
    }

    return unavailableVideoIndicies;
  },

  numberOfHiddenVideos: function () {
    const alert = document.querySelector("div#alerts yt-formatted-string");
    if (alert !== null) {
      const match = alert.innerText.match(/(?<num>\d*) unavailable videos are hidden/);
      if (match) {
        return parseInt(match.groups.num);
      }
    }
    return 0;
  },

  documentHeader: function (numVideos, numUnavailableVideos) {
    const pageTitle = document.title.replace(" - YouTube", "");
    const pageUrl = document.location.href;

    let header = `[${pageTitle}](${pageUrl}) as of ${this.timestamp()} (${numVideos} videos`

    if (numUnavailableVideos > 0) {
      header += `, ${numUnavailableVideos} unavailable)`;
    } else {
      header += ')';
    }

    return header;
  },

  filename: function (numVideos, numUnavailableVideos) {
    const pageTitle = document.title.replace(" - YouTube", "");

    let header = `${pageTitle} as of ${this.timestamp()} (${numVideos} videos`

    if (numUnavailableVideos > 0) {
      header += `, ${numUnavailableVideos} unavailable)`;
    } else {
      header += ')';
    }

    return header;
  },

  documentKey: function () {
    return [
      "- **Bolded entries have not yet been downloaded**",
      "- A checkbox indicates it has been downloaded and imported to the library.",
      "# Videos",
    ].join("\n")
  },

  timestamp: function () {
    const now = new Date;
    const minutes = now.getMinutes() < 10 ? `0${now.getMinutes()}` : now.getMinutes();
    const seconds = now.getSeconds() < 10 ? `0${now.getSeconds()}` : now.getSeconds();
    return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} @ ${now.getHours()}:${minutes}:${seconds}`;
  },
}

window.exportPlaylistTitles.run();
