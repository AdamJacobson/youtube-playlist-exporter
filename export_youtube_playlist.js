// Version 0.9
// Added checkboxes for copy/pasting into dropbox paper

window.exportPlaylistTitles = function () {
  const videosAndSections = document.querySelectorAll("div#contents div#meta, div#title.ytd-item-section-header-renderer");
  const header = doumentHeader(); // Will be overwritten on document.open();

  message = header + "\n";
  message += documentKey() + "\n";
  videosAndSections.forEach((videoOrSection, index) => {
    message += videoOrSectionEntry(videoOrSection, index) + "\n";
  });
  console.log(message);
}

const doumentHeader = function () {
  const pageTitle = document.title.replace(" - YouTube", "");
  const pageUrl = document.location.href;

  return `[${pageTitle}](${pageUrl}) as of ${timestamp()}`
}

const documentKey = function () {
  return "<ul><li><strong>Bolded entries have not yet been downloaded</strong></li><li>A checkbox indicates it has been downloaded and imported to the library.</li></ul><br/><br/>"
}

const videoOrSectionEntry = function (element, index) {
  if (element.id === 'title') {
    return sectionTitle(element)
  } else {
    return videoEntry(element, index)
  }
}

const sectionTitle = function (element) {
  return `<h3>${element.innerHTML}</h3>`
}

const videoEntry = function (video, index) {
  var title = video.querySelector("#video-title").title;
  var videoUrl = video.querySelector("#video-title").href.split("&")[0]; // Ignore any params except the first which is the video ID

  let entry = "";
  let bold = false;
  if (title == "[Deleted video]" || title == "[Private video]") {
    entry = `UNAVAILABLE [${title}](${videoUrl})`
  } else {
    bold = true
    var channel = video.querySelector("#channel-name a").text;
    var channelUrl = video.querySelector("#channel-name a").href;
    entry = `[${title}](${videoUrl}) | [${channel}](${channelUrl})`;
  }

  const row = `${index + 1}: ${entry}`;

  if (bold) {
    return `- [] **${row}**`;
  }

  return row;
}

const timestamp = function () {
  const now = new Date;
  const minutes = now.getMinutes() < 10 ? `0${now.getMinutes()}` : now.getMinutes();
  const seconds = now.getSeconds() < 10 ? `0${now.getSeconds()}` : now.getSeconds();
  return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} @ ${now.getHours()}:${minutes}:${seconds}`;
}

const buttonFinder = setInterval(() => {
  const buttons = document.querySelector(".metadata-buttons-wrapper");
  if (!buttons) {
    return;
  } else {
    clearInterval(buttonFinder);
    const btn = document.createElement("div");
    btn.onclick = function () { window.exportPlaylistTitles(); };
    btn.setHTML("Export Playlist")
    buttons.appendChild(btn);
  }
}, 500);
