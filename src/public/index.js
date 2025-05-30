let userId = sessionStorage.getItem("user");
if (!userId) {
  userId = crypto.randomUUID();
} else {
  window.location.href = "/player";
}

const form = document.querySelector(".form");
const username = document.getElementById("username");
const roomId = document.getElementById("roomId");
username.addEventListener("input", (e) => {
  if (e.target.value) {
    console.log(e.target.value);
    username.style.border = "1px solid black";
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!username.value) {
    username.style.border = "1px solid red";
    return;
  }

  sessionStorage.setItem(
    "user",
    JSON.stringify({
      userId: userId,
      username: username.value,
    })
  );
  if (roomId.value.trim()) sessionStorage.setItem("roomId", roomId.value);

  username.value = "";
  roomId.value = "";

  window.location.href = "/player";
});
