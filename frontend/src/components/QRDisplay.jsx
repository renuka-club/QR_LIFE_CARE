import React from "react";
import QRCode from "qrcode.react";

function QRDisplay({ user }) {
  // 🚨 HARD GUARD (prevents crash)
  if (!user || typeof user !== "object") {
    return <p>QR not ready</p>;
  }

  if (!user._id || typeof user._id !== "string") {
    return <p>QR loading...</p>;
  }

  // ✅ ONLY SHORT STRING
  const qrValue = user._id;

  return (
    <div className="qr-display">
      <h2>📱 My QR Code</h2>

      <QRCode
        value={qrValue}
        size={200}
        level="M"
        includeMargin={true}
      />

      <p>Scan in emergency to access records</p>
    </div>
  );
}

export default QRDisplay;
