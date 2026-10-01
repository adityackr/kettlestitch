import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social share card (1200×630): gradient glow, brand mark, tagline, pills. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0c0a09",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 900,
            height: 500,
            borderRadius: 999,
            background:
              "radial-gradient(closest-side, rgba(245,158,11,0.35), rgba(249,115,22,0.15), transparent)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #fbbf24, #f97316 55%, #e11d48)",
              color: "#fff",
              fontSize: 120,
              fontWeight: 700,
            }}
          >
            K
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ color: "#fff", fontSize: 92, fontWeight: 700, lineHeight: 1 }}>
              Kettlestitch
            </div>
            <div style={{ color: "#d6d3d1", fontSize: 36 }}>
              Private EPUB reading, beautifully simple.
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              {["On-device library", "Highlights", "EN + Bengali fonts"].map((pill) => (
                <div
                  key={pill}
                  style={{
                    border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: 999,
                    padding: "10px 22px",
                    color: "#fef3c7",
                    fontSize: 24,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {pill}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
