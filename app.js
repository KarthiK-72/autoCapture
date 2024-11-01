import React, { useEffect, useRef, useState, useCallback } from "react";
import stencil1SVG from './stencils/stencil1.svg';
import stencil2SVG from './stencils/stencil2.svg';
import stencil3SVG from './stencils/stencil3.svg';
import stencil4SVG from './stencils/stencil4.svg';
import stencil5SVG from './stencils/stencil5.svg';
import stencil6SVG from './stencils/stencil6.svg';
import stencil7SVG from './stencils/stencil7.svg';
import stencil8SVG from './stencils/stencil8.svg';

const stencilsMetadata = [
  { id: 1, name: "Stencil 1", svg: stencil1SVG },
  { id: 2, name: "Stencil 2", svg: stencil2SVG },
  { id: 3, name: "Stencil 3", svg: stencil3SVG },
  { id: 4, name: "Stencil 4", svg: stencil4SVG },
  { id: 5, name: "Stencil 5", svg: stencil5SVG },
  { id: 6, name: "Stencil 6", svg: stencil6SVG },
  { id: 7, name: "Stencil 7", svg: stencil7SVG },
  { id: 8, name: "Stencil 8", svg: stencil8SVG }
];

const AutoCaptureWithStencils = ({ processImage }) => {
  const videoRef = useRef(null);
  const [captures, setCaptures] = useState(Array(stencilsMetadata.length).fill(null)); // Store accepted images
  const [currentStencil, setCurrentStencil] = useState(0); // Track current stencil being processed

  // Start video stream for capturing images
  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    startVideo();
  }, []);

  // Capture and process images until each stencil is accepted
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!allStencilsProcessed()) {
        captureAndProcessImage(currentStencil);
      }
    }, 4000); // 4 seconds interval

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [currentStencil]);

  // Check if all stencils are processed
  const allStencilsProcessed = () => captures.every((capture) => capture !== null);

  // Capture image from the webcam
  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    }
    return null;
  };

  // Capture and process image for the current stencil
  const captureAndProcessImage = useCallback(async (stencilIndex) => {
    if (captures[stencilIndex] !== null) {
      moveToNextStencil(); // Skip already processed stencil
      return;
    }

    const imageSrc = captureImage();
    if (!imageSrc) return;

    const processedImage = await processImage(imageSrc, stencilsMetadata[stencilIndex]);

    if (processedImage) {
      // If accepted, save the processed image and move to the next stencil
      setCaptures((prevCaptures) => {
        const newCaptures = [...prevCaptures];
        newCaptures[stencilIndex] = processedImage;
        return newCaptures;
      });
      moveToNextStencil();
    }
  }, [processImage, captures, stencilsMetadata]);

  // Move to the next unprocessed stencil in order
  const moveToNextStencil = () => {
    setCurrentStencil((prevStencil) => {
      let nextStencil = (prevStencil + 1) % stencilsMetadata.length;
      while (captures[nextStencil] !== null && nextStencil !== prevStencil) {
        nextStencil = (nextStencil + 1) % stencilsMetadata.length;
      }
      return nextStencil;
    });
  };

  return (
    <div>
      <h3>Camera with Stencil Overlay</h3>
      <div style={{ position: "relative", width: "640px", height: "480px" }}>
        <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%" }} />
        {stencilsMetadata.map((stencil, index) =>
          index === currentStencil ? (
            <img
              key={stencil.id}
              src={stencil.svg}
              alt={stencil.name}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            />
          ) : null
        )}
      </div>

      <h3>Captured Images</h3>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {stencilsMetadata.map((stencil, index) => (
          <div key={index} style={{ border: "1px solid #ccc", padding: "10px" }}>
            {captures[index] ? (
              <img src={captures[index]} alt={`stencil-${index}`} width="100" />
            ) : (
              <div style={{ width: "100px", height: "100px", background: "lightgray" }}>
                <p>Waiting...</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutoCaptureWithStencils;
