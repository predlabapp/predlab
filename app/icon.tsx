import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0a0f 0%, #12101e 100%)",
          borderRadius: 6,
        }}
      >
        {/* Outer glow ring */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #c4b5fd 0%, #7c6af7 45%, #3d3580 100%)",
            boxShadow: "0 0 8px rgba(124,106,247,0.6)",
          }}
        >
          {/* Inner highlight */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.35)",
              top: 5,
              left: 7,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
