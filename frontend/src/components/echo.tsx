import { FC, useEffect, useReducer, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { Typography, Button, TextField, Stack } from "@mui/material";
import { SubmitHandler, useForm } from "react-hook-form";
import config from "../config";

type EchoInput = {
  message: string;
};

const Echo: FC = () => {
  const { register, handleSubmit, reset } = useForm<EchoInput>();
  const [status, setStatus] = useState("initializing");
  const [messages, setMessages] = useState<string[]>([]);
  const [client, setClient] = useState<WebSocket>();
  const [closed, forceClose] = useReducer(() => true, false);

  const initializeClient = async () => {
    const currentSession = await fetchAuthSession();
    const idToken = currentSession.tokens?.idToken;

    const client = new WebSocket(`${config.apiEndpoint}?idToken=${idToken}`);

    client.onopen = () => {
      setStatus("connected");
    };

    client.onerror = (e: any) => {
      setStatus("error (reconnecting...)");
      console.error(e);

      setTimeout(async () => {
        await initializeClient();
      });
    };

    client.onclose = () => {
      if (!closed) {
        setStatus("closed (reconnecting...)");

        setTimeout(async () => {
          await initializeClient();
        });
      } else {
        setStatus("closed");
      }
    };

    client.onmessage = async (message: any) => {
      const messageStr = JSON.parse(message.data);
      console.log(messages);
      setMessages((prev) => [...prev, messageStr.message]);
    };

    setClient(client);
  };

  const sendMessage: SubmitHandler<EchoInput> = async (input) => {
    if (client != null) {
      client.send(input.message);
      reset({ message: "" });
    }
  };

  const handleUserKeyPress = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(sendMessage)(); // this won't be triggered
    }
  };

  useEffect(() => {
    initializeClient();
    return () => {
      if (client != null) {
        forceClose();
        client.close();
      }
    };
  }, []);

  return (
    <Stack justifyContent="center" alignItems="center" sx={{ m: 2 }}>
      <Typography variant="h4" gutterBottom>
        WebSocket echo demo
      </Typography>

      <Typography variant="subtitle1" sx={{ color: "#808080" }} gutterBottom>
        status: {status}
      </Typography>

      <Stack direction="row" spacing={2} sx={{ m: 5 }}>
        <TextField id="message" label="Message" size="small" required {...register("message")} onKeyPress={handleUserKeyPress} sx={{ width: 400 }} />
        <Button variant="contained" color="primary" onClick={handleSubmit(sendMessage)}>
          Send
        </Button>
      </Stack>

      <Typography variant="subtitle1" gutterBottom>
        Messages returned from WebSocket server
      </Typography>

      {messages.map((msg) => (
        <Typography sx={{ color: "#808080" }}> {msg}</Typography>
      ))}
    </Stack>
  );
};

export default Echo;
