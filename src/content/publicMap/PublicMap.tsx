import { FC, useEffect, useRef, useState } from "react";
import { Map as PigeonMap, ZoomControl, Point, Marker } from "pigeon-maps";

import { Box, darken, Button, Typography, Popover, useTheme, Alert, AlertTitle, Dialog, Grid } from "@mui/material";
import { Place } from "@mui/icons-material";


type device = {
  mac: string,
  hardware?: number,
  devName?: string,
  pos: {
      long: number,
      lat: number,
      altitude: number,
  }
  name?: string,
  lastSeen: number;
  broadcastMsg: string;
}

function getTimeAgoInSeconds(timestamp: number): string {
  const nowInSeconds = Math.floor(new Date().getTime() / 1000); 
  const diffInSeconds = nowInSeconds - timestamp; 

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}

const PublicMap: FC<PublicMapProps> = () => {

  const theme = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('reconnecting');
  const [popOverOpen, setPopOverOpen] = useState(false);
  const [center, setCenter] = useState([-15.589, -51.5] as Point);
  const [zoom, setZoom] = useState(5);
  const [positions, setPositions] = useState<Map<string, device>>(new Map());
  const socketRef = useRef<WebSocket | null>(null);
  const clickedButtonRef = useRef<device | null>(null); 
  const buttonRefs = useRef(new Map()); 

  const getAnchor = () => {
    return clickedButtonRef.current ? buttonRefs.current.get(clickedButtonRef.current.mac) : '';
  }

  useEffect(() => {
    getAnchor();
  }, [clickedButtonRef, buttonRefs]);


  useEffect(() => {

    const connectWebSocket = () => {
      const socket = new WebSocket("wss://platform.meshbrasil.com/positions/");
      //const socket = new WebSocket("ws://localhost:3004/positions/");
      socketRef.current = socket;

      socket.addEventListener("open", (event) => {
        console.log("Connected to WebSocket");
        setConnectionStatus("connected");
        setTimeout(() => {
          setIsConnected(true);
        }, 1200);
      });

      socket.addEventListener("message", (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (e) {
          console.log(e);
        }

        console.log("Received message:", data);

        for (const device of data) {
          setPositions((prevPositions) => {
            const newPositions = new Map(prevPositions);
            newPositions.set(device.mac, device);
            return newPositions;
          });
        }
      });

      socket.addEventListener("close", (event) => {
        console.log("Disconnected from WebSocket");
        setConnectionStatus("reconnecting");
        setIsConnected(false);

        // Attempt to reconnect after a delay (e.g., 5 seconds)
        setTimeout(connectWebSocket, 5000);
      });
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
     };
  }, []);

  return (
    <>
      <PigeonMap
        center={center}
        zoom={zoom}
        zoomSnap={false}
        onBoundsChanged={({ center, zoom }) => {
          setCenter(center);
          setZoom(zoom);
        }}
      >
        {Array.from(positions.values()).map((entry) => {
          //console.log("printing---", entry);
          return (
            <Marker
              style={{ pointerEvents: "auto" }}
              anchor={[entry.pos.lat, entry.pos.long] as Point}
              key={entry.mac}
              onClick={() => {
                clickedButtonRef.current = entry;
                setPopOverOpen(true);
              }}
            >
              <>
                <div style={{ position: "relative", zIndex: 999 }}>
                  {zoom > 10 && !popOverOpen && (
                    <Button
                      sx={{ padding: 0.2 }}
                      style={{
                        background: `${theme.colors.alpha.white[50]}`,
                        position: "absolute",
                        left: "50%",
                        transform: "translate(-50%, -100%)",
                      }}
                    >
                      <b>{entry.devName ? entry.devName : entry.mac}</b>
                    </Button>
                  )}
                  <Place
                    ref={(buttonRef) =>
                      buttonRefs.current.set(entry.mac, buttonRef)
                    }
                    sx={{ width: 40, height: 40 }}
                    style={{ color: darken("#67EA94", 0.5) }}
                  />
                </div>
              </>
            </Marker>
          );
        })}
        <ZoomControl />
      </PigeonMap>
      <Dialog
        open={!isConnected}
      >
        {connectionStatus === "reconnecting" ? (
          <Alert
            severity={"warning"}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <AlertTitle sx={{ mt: 0.3 }}>Connecting ...</AlertTitle>
          </Alert>
        ) : (
          <Alert
            severity={"success"}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <AlertTitle sx={{ mt: 0.3 }}>Connected!</AlertTitle>
          </Alert>
        )}
      </Dialog>
      <Popover
        disableEnforceFocus={true}
        disableScrollLock={true}
        anchorEl={getAnchor()}
        onClose={() => setPopOverOpen(false)}
        open={popOverOpen}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        slotProps={{
          paper: { style: { width: "220px", flex: 1 } },
        }}
      >
        {clickedButtonRef.current && (
          <Box sx={{ padding: 1 }}>
            <Grid
              container
              sx={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
              }}
            >
              <Grid
                item
                xs={12}
                textAlign={"center"}
                sx={{
                  padding: 0.5,
                  mb: 1,
                }}
                style={{ background: theme.colors.secondary.lighter }}
              >
                <Typography variant="h4" sx={{ mb: 0.5 }}>
                  {clickedButtonRef.current?.devName
                    ? clickedButtonRef.current?.devName
                    : "ID: " + clickedButtonRef.current?.mac}
                </Typography>
              </Grid>

              <Grid item xs={6} textAlign={"right"}>
                <Typography variant="body2" sx={{ mr: 0.5 }}>
                  Longitude:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  {clickedButtonRef.current?.pos.long.toFixed(2)}&deg;
                </Typography>
              </Grid>

              <Grid item xs={6} textAlign={"right"}>
                <Typography variant="body2" sx={{ mr: 0.5 }}>
                  Latitude:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  {clickedButtonRef.current?.pos.lat.toFixed(2)}&deg;
                </Typography>
              </Grid>

              <Grid item xs={6} textAlign={"right"}>
                <Typography variant="body2" sx={{ mr: 0.5 }}>
                  Altitude:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  {clickedButtonRef.current?.pos.altitude.toFixed(2)} m
                </Typography>
              </Grid>

              {clickedButtonRef.current?.hardware && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Device type:{" "}
                  {clickedButtonRef.current?.hardware}
                </Typography>
              )}

              <Typography variant="body2">
                Last seen:{" "}
                {getTimeAgoInSeconds(clickedButtonRef.current?.lastSeen)}
              </Typography>

              {clickedButtonRef.current?.broadcastMsg && (
                <>
                  <Grid
                    item
                    xs={12}
                    textAlign={"center"}
                    sx={{
                      padding: 0.5,
                      mt: 1,
                    }}
                    style={{ background: theme.colors.primary.lighter }}
                  >
                    <Typography variant="body2">
                      {clickedButtonRef.current?.broadcastMsg}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        )}
      </Popover>
    </>
  );
};

interface PublicMapProps {
  className?: string;
}

export default PublicMap;
