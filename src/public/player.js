let user = JSON.parse(sessionStorage.getItem("user"));
let roomId = sessionStorage.getItem("roomId");
const mainSection = document.getElementById("main-section");
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
if (!user) {
  window.location.href = "/";
} else {
  const socket = io("http://localhost:3000");

  let musicQueue = [];
  let current = 0;
  const inputVal = document.getElementById("input-val");
  const sendBtn = document.getElementById("send-btn");
  const nextBtn = document.getElementById("next");
  const prevBtn = document.getElementById("prev");
  const videoContainer = document.querySelector(".queue-wrapper");
  let player;
  let shouldCreatePlayer = false;

  function createPlayer() {
    console.log("inside createPlayer");
    player = new YT.Player("player", {
      videoId: musicQueue[current],
      playerVars: {
        playsinline: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: (event) => {
          if (
            event.data === 101 ||
            (event.data === 150 && current < musicQueue.length)
          ) {
            socket.emit("auto-next", (cb) => {
              if (cb.status) player.loadVideoById(musicQueue[current]);
            });
          }
        },
      },
    });
  }

  window.onYouTubeIframeAPIReady = () => {
    if (!shouldCreatePlayer) return;
    console.log("creating player");
    createPlayer();
  };

  function onPlayerReady(event) {
    if (musicQueue.length !== 0) event.target.playVideo();
  }

  function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
      document.getElementById("pause-icon").style.display = "none";
      document.getElementById("play-icon").style.display = "block";
    } else if (event.data == YT.PlayerState.ENDED) {
      document.getElementById("pause-icon").style.display = "block";
      document.getElementById("play-icon").style.display = "none";
      if (current < musicQueue.length - 1) {
        socket.emit("auto-next", (res) => {
          if (res.status) player.loadVideoById(musicQueue[current]);
        });
      } else {
        socket.emit("queue-ended");
      }
    }
  }

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
            document.querySelector(".right-section").classList.add("w-full");
            document.getElementById("player").style.display = "none";
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

  function renderQueue() {
    videoContainer.innerHTML = "";
    for (let i = 0; i < musicQueue.length; i++) {
      const str = `
    <div class="queue-list">
    <img
      src=https://img.youtube.com/vi/${musicQueue[i]}/hqdefault.jpg
    />
    <div>
      <p>Added by as</p> 
    </div>
  </div>
`;

      const temp = document.createElement("div");
      temp.innerHTML = str;

      const newNode = temp.firstElementChild;
      if (current === i) {
        newNode.style.backgroundColor = "black";
      }
      videoContainer.appendChild(newNode);
    }
  }

  socket.on("sync-data", (data) => {
    console.log("syncing", data);
    musicQueue = data.musicQueue;
    current = data.current;
    renderQueue();

    if (
      (player && musicQueue.length === 1) ||
      current === musicQueue.length - 1
    )
      player.loadVideoById(musicQueue[current]);
  });

  socket.on("new-creator", () => {
    if (!player) createPlayer();
    document.getElementById("player").style.display = "flex";
    document.getElementById("main-section").style.display = "flex";
    document.getElementById("main-section").style.flexDirection = "row";
    document.querySelector(".right-section").classList.remove("w-full");
    document.querySelector(".bottom-section").style.display = "grid";
  });

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
      socket.emit("add-video", ytId, (res) => {
        if (res.status) {
          showToast("Added to Queue", true);
        }
      });
    }
    inputVal.value = "";
  });

  nextBtn.addEventListener("click", () => {
    if (current < musicQueue.length - 1) {
      socket.emit("next-video", user.userId, (res) => {
        if (res.status) player.loadVideoById(musicQueue[current]);
      });
    }
  });

  prevBtn.addEventListener("click", () => {
    if (current > 0) {
      socket.emit("prev-video", user.userId, (res) => {
        if (res.status) {
          player.loadVideoById(musicQueue[current]);
        }
      });
    }
  });
}
