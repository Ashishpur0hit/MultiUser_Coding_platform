import Spline from '@splinetool/react-spline';

export default function App() {
    const handleLoad = (spline) => {
        const { camera } = spline;
        // Adjust the camera's position to zoom out
        camera.position.set(0, 0, 10); // Move the camera back on the Z-axis
        camera.updateProjectionMatrix();
      };
  return (
    <Spline scene="https://prod.spline.design/fOifpUv4fsrJPtKF/scene.splinecode" onLoad={handleLoad} />
  );
}
