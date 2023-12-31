import { Hono } from "hono";
import { logger } from "hono/logger";
import satori from "satori";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cors } from 'hono/cors'

const port = parseInt(
  process.env.PORT || "4124",
);

const app = new Hono({
  strict: false,
});

app.use('*', cors({
  origin: (c) => c,
  credentials: true
}))
app.use("*", logger());

app.use("*", async (c, next) => {
  c.header("Vary", "Origin")
  await next();
})

const fontPath = join(process.cwd(), "assets", "Roboto-Regular.ttf");
const fontData = await readFile(fontPath);

const game = {
  lastUpdated: Date.now(),
  data: undefined as any
  // data: {
  //   title: "A epic vidja",
  //   thumbnail: "https://i.ytimg.com/vi/VYOjWnS4cMY/sddefault.jpg?sqp=-oaymwEWCJADEOEBIAQqCghqEJQEGHgg6AJIWg&rs=AMzJL3niLRYwOlsS6IhmL1yhITqg965rQg",
  //   artist: "Eminem",
  //   duration: {
  //     at: 2000,
  //     end: 10000,
  //   }
  // }
}

app.get("/", (c) => {
  return new Response(
    undefined
  )
})

app.post("/", async (c) => {
  const secret = process.env.MUSIC_SECRET;
  if (secret != c.req.headers.get("secret")) {
    return c.json({ status: 401 }, 401)
  }

  const body = await c.req.json();
  game.lastUpdated = Date.now();

  if (JSON.stringify(game.data?.videoId) === JSON.stringify(body.videoId) && JSON.stringify(game.data.duration) === JSON.stringify(body.duration)) {
    game.data.paused = true;
    return c.json({ status: 200 }, 200);
  }

  game.data = body;

  return c.json({ status: 200 }, 200);
})

app.get("/.svg", async (c) => {
  let data = game.data ?? { duration: {} }

  const at = (data.duration.at ?? 0) + ((Date.now() - game.lastUpdated) / 1000);

  if (at > data.duration.end) {
    data = { duration: {} }; game.data = undefined;
  }

  const svg = await satori(
    <div
      style={{
        backgroundColor: "red",
        color: "black",
        display: "flex",
        flexDirection: "column",
        borderRadius: "10px",
        height: "100%",
        width: "100%",
      }}
    >

      <img
        style={{
          borderRadius: "10px",
          height: "100%",
          width: "100%",
          objectFit: "cover",
          position: "absolute",
          boxShadow: "inset 0px 0px 50px 50px rgba(0, 0, 0, 0.6)",
        }}
        height={230}
        width={500}
        src={data.thumbnail ?? 'https://lh3.googleusercontent.com/U9DTgHAZAXCDbXbaAm5AycnEqTOdaNngi6RoN796rvmXlHCZQjC4NV5FWA9QPmfMzmHTvDrYyAMvNZ00=w1500-h844-l90-rj'}
      />


      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginLeft: "20px",
          height: "100%",
          width: "100%",
          justifyContent: "center",
          position: "absolute",
        }}
      >
        <p style={{ color: "white", margin: "0", fontSize: "25px", textShadow: "1px 1px 2px black" }}>
          {data.title ?? "Currently not playing anything"}
        </p>
        <p style={{ color: "whitesmoke", margin: "0", textShadow: "1px 1px 2px black" }}>{data.artist ?? "Tricked-dev"}</p>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: "auto",
          marginLeft: "10px",
          marginRight: "10px",
          top: "-30px",
          color: "white",
        }}
      >

        <div
          style={{
            position: "absolute",
            top: "10px",
            width: "100%",
            height: "7px",
            backgroundColor: "gray",
            borderRadius: "5px",
            border: "none",
            overflow: "hidden",
            boxShadow: "12px 12px 2px 1px rgba(0, 0, 255, .2);"
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "10px",
            width: `${Math.max((at / data.duration.end) * 100, 1) | 0}%`,
            height: "7px",
            backgroundColor: "white",
            borderRadius: "5px",
            border: "none",
            overflow: "hidden",
          }}
        />
      </div>
    </div>,
    {
      width: 500,
      height: 230,
      fonts: [
        {
          name: "Roboto",
          data: fontData,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );

  return c.text(svg, 200, {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "max-age=2",
  });
});

console.log(`Listening on port http://localhost:${port}`);

export default { ...app, port };
