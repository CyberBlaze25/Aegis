import { useEffect } from "react";
import { socket } from "../services/socket";

export function useSocket(event, handler) {
  useEffect(() => {
    socket.on(event, handler);
  }, [event, handler]);
}