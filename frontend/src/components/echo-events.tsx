import { FC, useEffect, useState } from "react";
import { Typography, Button, TextField, Stack } from "@mui/material";
import { SubmitHandler, useForm } from "react-hook-form";
import { events } from "aws-amplify/data";

type EchoInput = {
  message: string;
};

const EchoEvents: FC = () => {
  const { register, handleSubmit, reset } = useForm<EchoInput>();
  const [status, setStatus] = useState("initializing");
  const [messages, setMessages] = useState<string[]>([]);

  const initializeClient = async () => {
    console.log(`initializing connection...`);
    const channel = await events.connect("/default/test");
    channel.subscribe({
      next: (data) => {
        console.log(data);
        setMessages((prev) => [...prev, data.message.message]);
      },
      error: (err) => {
        console.error(`error on subscription ${err}`);
        setStatus("error");
      },
    });
    setStatus("connected");
    console.log("successfully initialized connection.");
    return channel;
  };

  const sendMessage: SubmitHandler<EchoInput> = async (input) => {
    await events.post(`/default/test`, { message: input });
  };

  const handleUserKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(sendMessage)(); // this won't be triggered
    }
  };

  useEffect(() => {
    const pr = initializeClient();
    return () => {
      pr.then((channel) => {
        channel.close();
        // events.closeAll();
        console.log(`successfully closed connection.`);
      });
      setStatus("closed");
    };
  }, []);

  return (
    <Stack justifyContent="center" alignItems="center" sx={{ m: 2 }}>
      <Typography variant="h4" gutterBottom>
        AppSync Events Pub/Sub demo
      </Typography>

      <Typography variant="subtitle1" sx={{ color: "#808080" }} gutterBottom>
        status: {status}
      </Typography>

      <Stack direction="row" spacing={2} sx={{ m: 5 }}>
        <TextField id="message" label="Message" size="small" required {...register("message")} onKeyDown={handleUserKeyDown} sx={{ width: 400 }} />
        <Button variant="contained" color="primary" onClick={handleSubmit(sendMessage)}>
          Send
        </Button>
      </Stack>

      <Typography variant="subtitle1" gutterBottom>
        Messages returned from AppSync Events
      </Typography>

      {messages.map((msg, i) => (
        <Typography sx={{ color: "#808080" }} key={i}>
          {msg}
        </Typography>
      ))}
    </Stack>
  );
};

export default EchoEvents;
