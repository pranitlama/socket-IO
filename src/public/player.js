let user = JSON.parse(sessionStorage.getItem("user"));
let roomId = sessionStorage.getItem("roomId");
const mainSection = document.getElementById("main-section");
if (!user) {
  window.location.href = "/";
} else {
  const socket = io("http://localhost:3000");

  let musicQueue = [];
  let current = 0;
  let shouldCreatePlayer = false;
  const inputVal = document.getElementById("input-val");
  const sendBtn = document.getElementById("send-btn");
  const toast = document.getElementById("toast");

  const tag = document.createElement("script");
  socket.on("connect", () => {
    socket.emit(
      "join-room",
      {
        userId: user.userId,
        username: user.username,
        roomId: roomId || socket.id,
      },
      (res) => {
        mainSection.style.display = "flex";
        if (res.status) {
          sessionStorage.setItem("roomId", res.roomId);
          if (res.isCreator) {
            shouldCreatePlayer = true;
          } else {
            document.querySelector(".main-section").style.flexDirection =
              "column-reverse";
            document.querySelector(".right-section").style.width = "100%";
            document.querySelector(".bottom-section").style.display = "none";
          }
        } else {
          console.log("sed");
        }
      }
    );
  });

  socket.on("announce", (username) => {
    showToast(
      `${user.username === username ? "You" : username} joined the room`,
      true
    );
  });
  socket.on("sync-data", (data) => {
    console.log("syncing", data);
    musicQueue = data.musicQueue;
    current = data.current;
  });

  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  let player;
  function onYouTubeIframeAPIReady() {
    if (!shouldCreatePlayer) return;
    player = new YT.Player("player", {
      videoId: musicQueue[current],
      playerVars: {
        playsinline: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  }

  function onPlayerReady(event) {}

  function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
    }
  }

  function showToast(text, success) {
    const toastContainer = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "show";
    toast.innerText = text;
    toast.style.backgroundColor = success ? "#30A46C" : "#4E1511";
    toast.style.zIndex = toastContainer.childElementCount + 1;
    toastContainer.appendChild(toast);
    setTimeout(function () {
      toast.className = toast.className.replace("show", "");

      toastContainer.removeChild(toast);
    }, 3000);
  }

  sendBtn.addEventListener("click", () => {
    if (inputVal.value === "") return;
    let ytId;
    try {
      const url = new URL(inputVal.value);
      ytId = url.searchParams.get("v");
      if (!ytId) {
        throw new Error();
      }

      console.log(ytId);
    } catch (error) {
      if (inputVal.value.length === 11) {
        ytId = inputVal.value;
      } else {
        showToast("Invalid Id", false);
      }
    }
    if (ytId) {
      console.log(ytId);
      socket.emit("add-video", ytId);
    }
  });
}
