import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const workerRef = useRef(null);

  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOcrReady, setIsOcrReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
   

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

    async function loadOCR() {
      try {
        const worker = await createWorker("eng");

        await worker.setParameters({
          tessedit_char_whitelist:
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:/.- ",
        });

        workerRef.current = worker;
        setIsOcrReady(true);
      } catch (err) {
        console.error("Error loading OCR:", err);
        setError("OCR failed to load.");
      }
    }

    startCamera();
    loadOCR();

    return () => {
      if (workerRef.current) {
            workerRef.current.terminate();
          }
        };
  }, []);

  async function captureCard() {
  if (!videoRef.current || !canvasRef.current) return;

  if (!workerRef.current) {
    setError("OCR is still loading. Try again in a few seconds.");
    return;
  }

  setIsProcessing(true);
  setText("");
  setError("");

  const video = videoRef.current;
  const canvas = canvasRef.current;
  const context = canvas.getContext("2d");

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  if (!videoWidth || !videoHeight) {
    setError("Camera is not ready yet. Try again in a moment.");
    setIsProcessing(false);
    return;
  }

  // Crop from the actual video size
  const cropWidth = videoWidth * 0.7;
  const cropHeight = videoHeight * 0.7;
  const cropX = (videoWidth - cropWidth) / 2;
  const cropY = (videoHeight - cropHeight) / 2;

  // Output size for OCR
  canvas.width = 600;
  canvas.height = 400;

  // Draw cropped video area into smaller canvas
  context.drawImage(
    video,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Image cleanup
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const value = gray > 128 ? 255 : 0;

    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  context.putImageData(image, 0, 0);

  const imageData = canvas.toDataURL("image/png");

  setCapturedImage(imageData);

  try {
    const result = await workerRef.current.recognize(imageData);
    setText(result.data.text);
  } catch (err) {
    console.error("Error processing OCR:", err);
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

        <button onClick={captureCard} disabled={isProcessing || !isOcrReady}>
          {isProcessing ? "Scanning..." : "Scan Text"}
        </button>

        {capturedImage && (
        <div className="capture-preview">
          <h2>Captured Image</h2>
          <img src={capturedImage} alt="Captured card preview" width="300" />
        </div>
        )}

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