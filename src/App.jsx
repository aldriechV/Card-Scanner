import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError(
          "Unable to access the camera. Please allow camera access and try again."
        );
        console.error("Error accessing camera:", err);
      }
    }

    startCamera();
  }, []);

  async function captureCard() {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setText("");
    setError("");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/png");

    try {
      const worker = await createWorker("eng");

      const result = await worker.recognize(imageData);

      setText(result.data.text);

      await worker.terminate();
    } catch (err) {
      console.error("Error processing OCR", err);
      setError("Error processing the card. Please try again.");
    }

    setIsProcessing(false);
  }

  return (
    <div className="app-container">
      <div className="video-container">
        <h1>Card Scanner</h1>

        {error && <p className="error">{error}</p>}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera"
        />

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <button onClick={captureCard} disabled={isProcessing}>
          {isProcessing ? "Scanning..." : "Scan Text"}
        </button>

        <div className="result-box">
          <h2>Detected Text</h2>
          <pre>{text}</pre>
        </div>
      </div>

      <div className="info-container">
        <p>Card Name</p>
        <p>Set:</p>
        <p>Cost</p>
        <p>Rarity</p>
      </div>
    </div>
  );
}

export default App;