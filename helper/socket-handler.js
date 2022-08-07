import { Server as socketServer } from "socket.io";

let io;

const getIo = () => {
  return io;
};

const setIo = (httpServer) => {
  io = new socketServer(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
    },
  });
  return io;
};

const wrapper = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);

const isSocketConnected = async ({ of, to }) => {
  let socketSize = io;

  if (of) socketSize = socketSize?.of(of);

  if (to) socketSize = socketSize?.to(to);

  socketSize = await socketSize?.allSockets();

  socketSize = socketSize.size;

  return socketSize > 0;
};

const socketEmit = ({ of, to, url, data }) => {
  let socket = io;
  if (of) socket = socket.of(of);
  if (to) socket = socket.to(to);
  socket.emit(url, data);
  console.log(
    `-----Socket Emit-----\n${of ? `of:${of}\n` : ""}${
      to ? `to:${to}\n` : ""
    }url:${url}\ndata:${data}`
  );
};

export default {
  setIo,
  getIo,
  wrapper,
  isSocketConnected,
  socketEmit,
};
