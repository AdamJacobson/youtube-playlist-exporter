window.exportPlaylistTitles = {
  lastRunPageData: null,
  currentPageData: null,
  interval: null,
  mode: null,

  run: function (mode) {
    this.mode = mode;
    this.currentPageData = this.getCurrentPageData();

    const numberOfHiddenVideos = this.currentPageData.metadata.numHiddenVideos;
    if (numberOfHiddenVideos > 0) {
      this.lastRunPageData = this.currentPageData;

      console.log(`%c${numberOfHiddenVideos} videos are hidden. Click the "Show unavailable videos" button to run this again and detect which ones are unavailable.`, "color:red");
      // alert(`${numberOfHiddenVideos} videos are hidden.\nAvailable videos have been recorded.\nClick the "Show unavailable videos" button to run this again.`);
      this.setupWaitForReload();
      return;
    } else {
      if (!!this.lastRunPageData) {
        this.compareVideosWithPreviousRun();
      }
    }

    this.downloadRawData();
    this.downloadFormattedData();
  },

  getCurrentPageData: function () {
    const [videos, numUnavailableVideos] = this.getCurrentPageVideoData();
    const metadata = this.getCurrentPageMetadata();
    metadata.numUnavailableVideos = numUnavailableVideos;

    return {
      metadata: metadata,
      videos: videos,
    };
  },

  getCurrentPageVideoData: function () {
    const videos = [];
    const videosAndSections = document.querySelectorAll("div#contents div#meta, div#title.ytd-item-section-header-renderer");
    let numUnavailableVideos = 0;

    for (const [_, videoOrSection] of Object.entries(videosAndSections)) {
      if (videoOrSection.id === 'title') {
        break;
      }

      const data = this.videoData(videoOrSection);
      if (!data.available) {
        numUnavailableVideos++;
      }

      videos.push(data);
    }

    return [videos, numUnavailableVideos];
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

  getCurrentPageMetadata: function () {
    const infoElement = document.querySelector("div.page-header-view-model-wiz__page-header-content");

    const playlistTitle = infoElement.querySelector("h1").innerText;

    const metadataElement = infoElement.querySelector("yt-content-metadata-view-model");

    const author = metadataElement.querySelector("a");
    const authorName = author.innerText.replace(/^by /, "");
    const authorUrl = author.href;

    const details = metadataElement.querySelectorAll("span.yt-core-attributed-string")
    const type = details[1].innerText;
    const visibility = details[2].innerText;
    const numVideos = parseInt(details[3].innerText);
    const numViews = parseInt(details[4].innerText);

    const description = infoElement.querySelector("truncated-text-content span")?.innerText || null;

    return {
      playlistTitle: playlistTitle,
      playlistUrl: document.location.href,
      type: type,
      visibility: visibility,
      numVideos: numVideos,
      numHiddenVideos: this.getNumberOfHiddenVideos(),
      numViews: numViews,
      authorName: authorName,
      authorUrl: authorUrl,
      description: description,
    };
  },

  filename: function () {
    const pageTitle = this.currentPageData.metadata.playlistTitle;
    const numVideos = this.currentPageData.metadata.numVideos;
    const numUnavailableVideos = this.currentPageData.metadata.numUnavailableVideos;

    let header = `${pageTitle} as of ${this.timestamp()} (${numVideos} videos`

    if (numUnavailableVideos > 0) {
      header += `, ${numUnavailableVideos} unavailable`;
    }

    header += ')';

    return header;
  },

  timestamp: function () {
    const now = new Date;
    const minutes = now.getMinutes() < 10 ? `0${now.getMinutes()}` : now.getMinutes();
    const seconds = now.getSeconds() < 10 ? `0${now.getSeconds()}` : now.getSeconds();
    return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} @ ${now.getHours()}:${minutes}:${seconds}`;
  },

  // Source: https://stackoverflow.com/questions/47942244/print-javascript-object-to-txt-file
  download: function (data, filename, type) {
    if (this.mode === 'test') {
      console.log(this.filename(), type);
      try {
        const parsed = JSON.parse(data);
        console.log(parsed);
      } catch {
        console.log(data);
      }
      return;
    }

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

  setupWaitForReload: function () {
    this.interval = setInterval(() => {
      const alert = document.querySelector("div#alerts yt-formatted-string");
      if (alert.innerText === "Unavailable videos will be hidden during playback") {
        clearInterval(this.interval);
        this.run(this.mode);
      }
    }, 500);
  },

  // Given the current list of videos, compare with the previous run and determine which ones are unavailable
  compareVideosWithPreviousRun: function () {
    const previousVideos = this.lastRunPageData.videos;
    const currentVideos = this.currentPageData.videos;
    let numUnavailableVideos = 0;

    const endIndex = Math.max(previousVideos.length, currentVideos.length);
    let index1 = 0;
    let index2 = 0;

    while (index1 < endIndex && index2 < endIndex) {
      const v1 = previousVideos[index1];
      const v2 = currentVideos[index2];

      if (v1.videoUrl !== v2.videoUrl) {
        v2.available = false;
        numUnavailableVideos++;
        index2++;
      } else {
        v2.available = true;
        index1++;
        index2++;
      }
    }

    this.currentPageData.metadata.numUnavailableVideos = numUnavailableVideos;
  },

  getNumberOfHiddenVideos: function () {
    const alert = document.querySelector("div#alerts yt-formatted-string");
    if (alert !== null) {
      const match = alert.innerText.match(/(?<num>\d*) unavailable videos are hidden/);
      if (match) {
        return parseInt(match.groups.num);
      }
    }
    return 0;
  },

  documentKey: function () {
    return [
      "- **Bolded entries have not yet been downloaded**",
      "- A checkbox indicates it has been downloaded and imported to the library.",
      "# Videos",
    ].join("\n")
  },

  downloadRawData: function() {
    this.download(JSON.stringify(this.currentPageData), this.filename(), 'text/javascript');
  },

  downloadFormattedData: function () {
    const fileContents = [];
    const header = this.documentHeader();

    fileContents.push(header);
    fileContents.push(this.documentKey());

    const videos = this.currentPageData.videos;
    videos.forEach((video, index) => {
      const available = video.available;
      const availability = available ? '' : 'UNAVAILABLE ';
      let channelLink;

      if (!!video.channelUrl) {
        channelLink = `[${video.channelTitle}](${video.channelUrl})`;
      } else {
        channelLink = video.channelTitle;
      }

      let line = `${index + 1}: ${availability}[${video.videoTitle}](${video.videoUrl}) | ${channelLink}`;
      if (available) {
        line = `- [] **${line}**`;
      }

      if (!available) {
        fileContents.push("");
      }

      fileContents.push(line);
    });

    this.download(fileContents.join("\n"), this.filename(), 'text/plain');
  },

  documentHeader: function () {
    const pageTitle = this.currentPageData.metadata.playlistTitle;
    const pageUrl = this.currentPageData.metadata.playlistUrl;
    const numVideos = this.currentPageData.metadata.numVideos;
    const numUnavailableVideos = this.currentPageData.metadata.numUnavailableVideos;

    let header = `[${pageTitle}](${pageUrl}) as of ${this.timestamp()} (${numVideos} videos`

    if (numUnavailableVideos > 0) {
      header += `, ${numUnavailableVideos} unavailable)`;
    } else {
      header += ')';
    }

    return header;
  },
}

window.exportPlaylistTitles.run('test');
