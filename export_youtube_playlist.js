// Version 0.11
window.exportPlaylistTitles = {
  run: function () {
    const videos = this.getMainSectionVideos();

    let unavailableVideoIndicies = [];
    if (this.lastRunVideos.length > 0) {
      unavailableVideoIndicies = this.compareVideosWithPreviousRun(videos);
    }

    this.lastRunVideos = Array.from(videos).map(video => video.innerText)

    const numHidden = this.numberOfHiddenVideos();
    if (numHidden > 0) {
      console.log(`%c${numHidden} videos are hidden. Click the "Show unavailable videos" button to run this again.`, "color:red")
      this.waitForReload();
      return;
    }

    const message = [];
    message.push(this.documentHeader(videos.length, unavailableVideoIndicies.length));

    message.push(this.documentKey());
    videos.forEach((videoOrSection, index) => {
      message.push(this.videoOrSectionEntry(videoOrSection, index, unavailableVideoIndicies));
    });
    console.log(message.join("\n"));
  },

  getMainSectionVideos: function () {
    const videosAndSections = document.querySelectorAll("div#contents div#meta, div#title.ytd-item-section-header-renderer");
    const mainSectionVideos = [];
    for (const [_, videoOrSection] of Object.entries(videosAndSections)) {
      if (videoOrSection.id === 'title') {
        break;
      }
      mainSectionVideos.push(videoOrSection);
    }

    return mainSectionVideos;
  },

  interval: null,

  waitForReload: function () {
    this.interval = setInterval(() => {
      const alert = document.querySelector("div#alerts yt-formatted-string");
      if (alert.innerText === "Unavailable videos will be hidden during playback") {
        clearInterval(this.interval);
        this.run();
      }
    }, 500);
  },

  lastRunVideos: [],

  compareVideosWithPreviousRun: function (currentVideos) {
    const previousVideos = this.lastRunVideos;
    const unavailableVideoIndicies = [];

    const endIndex = Math.max(previousVideos.length, currentVideos.length);
    let index1 = 0;
    let index2 = 0;

    while (index1 < endIndex && index2 < endIndex) {
      const v1 = previousVideos[index1];
      const v2 = currentVideos[index2].innerText;

      if (v1 !== v2) {
        unavailableVideoIndicies.push(index2);
        index2++;
      } else {
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

  documentKey: function () {
    return "<ul><li><strong>Bolded entries have not yet been downloaded</strong></li><li>A checkbox indicates it has been downloaded and imported to the library.</li></ul><br/><br/>"
  },

  // I don't think I need to check for title sections anymore...
  videoOrSectionEntry: function (element, index, unavailableVideoIndicies) {
    if (element.id === 'title') {
      return this.sectionTitle(element)
    } else {
      return this.videoEntry(element, index, unavailableVideoIndicies)
    }
  },

  sectionTitle: function (element) {
    return `<h3>${element.innerHTML}</h3>`
  },

  videoEntry: function (video, index, unavailableVideoIndicies) {
    const title = video.querySelector("#video-title").title;
    const videoUrl = video.querySelector("#video-title").href.split("&")[0]; // Ignore any params except the first which is the video ID
    const channelElement = video.querySelector("#channel-name a");
    let channel = null;
    let channelUrl = null;
    if (channelElement) {
      channel = video.querySelector("#channel-name a").text;
      channelUrl = video.querySelector("#channel-name a").href;
    }

    let entry = "";
    let bold = false;
    let extraNewLine = "";
    if (title == "[Deleted video]" || title == "[Private video]" || unavailableVideoIndicies.includes(index)) {
      extraNewLine = "\n";
      entry = `UNAVAILABLE [${title}](${videoUrl})`
      if (channelElement) {
        entry += ` | [${channel}](${channelUrl})`;
      }
    } else {
      bold = true

      entry = `[${title}](${videoUrl}) | [${channel}](${channelUrl})`;
    }

    const row = `${index + 1}: ${entry}`;

    if (bold) {
      return `- [] **${row}**`;
    }

    return extraNewLine + row;
  },

  timestamp: function () {
    const now = new Date;
    const minutes = now.getMinutes() < 10 ? `0${now.getMinutes()}` : now.getMinutes();
    const seconds = now.getSeconds() < 10 ? `0${now.getSeconds()}` : now.getSeconds();
    return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} @ ${now.getHours()}:${minutes}:${seconds}`;
  },
}

window.exportPlaylistTitles.run()
