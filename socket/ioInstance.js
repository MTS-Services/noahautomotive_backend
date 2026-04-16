// Shared Socket.io instance — set once in server.js, imported anywhere needed
let _io = null;

const setIo = (io) => {
  _io = io;
};

const getIo = () => {
  if (!_io) throw new Error("Socket.io not initialised");
  return _io;
};

module.exports = { setIo, getIo };
