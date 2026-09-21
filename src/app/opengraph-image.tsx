import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "Aero Cotton — premium cotton home textiles from Karur, India";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const dyes = ["#4d5f52", "#b08d57", "#5d6b7a", "#a4743f", "#354a42"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f4f0e8",
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 20,
            letterSpacing: "0.4em",
            color: "#8a7d70",
            textTransform: "uppercase",
          }}
        >
          Karur · Tamil Nadu · India
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 700,
              color: "#171614",
              letterSpacing: "0.08em",
            }}
          >
            AERO COTTON
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 32,
              color: "#57493f",
            }}
          >
            Ten landscapes. One thread.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {dyes.map((dye) => (
            <div
              key={dye}
              style={{
                display: "flex",
                width: 96,
                height: 16,
                background: dye,
                borderRadius: 8,
              }}
            />
          ))}
          <div style={{ display: "flex", flexGrow: 1 }} />
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: "0.2em",
              color: "#8a7d70",
            }}
          >
            AEROCOTTON.IN
          </div>
        </div>
      </div>
    ),
    size
  );
}
