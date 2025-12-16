const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

const users = {};

io.on("connection", (socket) => {
  socket.channel = "자유";

  const now = () =>
    new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

  socket.on("join", (nick) => {
    users[socket.id] = {
      nick,
      joinTime: Date.now()
    };

    socket.join(socket.channel);

    io.to(socket.channel).emit(
      "system",
      `## ${nick} 님이 입장하였습니다. (${now()}) ##`
    );
  });

  socket.on("chat", (msg) => {
    const user = users[socket.id];
    if (!user) return;

    if (msg.startsWith("/join ")) {
      const newCh = msg.replace("/join ", "").trim();
      socket.leave(socket.channel);
      socket.channel = newCh;
      socket.join(newCh);
      socket.emit("system", `## ${newCh} 채널로 이동 ##`);
      return;
    }

    if (msg === "/time") {
      const sec = Math.floor((Date.now() - user.joinTime) / 1000);
      socket.emit("system", `접속 시간: ${sec}초`);
      return;
    }

    if (msg === "/who") {
      const room = io.sockets.adapter.rooms.get(socket.channel);
      socket.emit("system", `접속자 수: ${room ? room.size : 1}`);
      return;
    }

    io.to(socket.channel).emit(
      "chat",
      `[${now()}] ${user.nick} : ${msg}`
    );
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (!user) return;

    io.to(socket.channel).emit(
      "system",
      `## ${user.nick} 님이 퇴장하였습니다. (${now()}) ##`
    );

    delete users[socket.id];
  });
});

http.listen(process.env.PORT || 3000, () =>
  console.log("PC통신 WebOS 실행중")
);
