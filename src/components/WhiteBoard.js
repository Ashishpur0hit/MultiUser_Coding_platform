



import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import ACTIONS from '../Actions';

const WhiteBoard = ({ canDraw, socket_ref, roomId }) => {
  const [tool, setTool] = useState('pen'); // Options: 'pen', 'rect', 'circle', 'eraser'
  const [shapes, setShapes] = useState([]); // Stores finalized shapes
  const [currentShape, setCurrentShape] = useState(null); // Temporary shape during drawing
  const isDrawing = useRef(false);

  useEffect(() => {
    if (socket_ref) {
      socket_ref.current.on('drawn', (data) => {
        if (data && data.points && data.tool) {
          setShapes((prevShapes) => [...prevShapes, data]);
        }
      });
    }
  }, [socket_ref]);

  const handleMouseDown = (e) => {
    if (!canDraw) return;

    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();

    const newShape = {
      tool,
      points: [pos.x, pos.y],
      color: tool === 'eraser' ? 'white' : 'black',
      id: shapes.length,
    };
    setCurrentShape(newShape);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || !canDraw) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    if (currentShape) {
      const updatedShape = {
        ...currentShape,
        points: [...currentShape.points, point.x, point.y],
      };
      setCurrentShape(updatedShape);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;

      if (currentShape) {
        setShapes((prevShapes) => [...prevShapes, currentShape]);

        // Emit the finalized shape to other users
        if (socket_ref) {
          socket_ref.current.emit(ACTIONS.DRAW_EVENT, { roomId, currentShape });
        }
        setCurrentShape(null);
      }
    }
  };

  return (
    <div className="bg-white h-full p-2 w-full flex justify-around flex-row">
      {/* Drawing Tools */}
      <div>
        <button
          onClick={() => setTool('pen')}
          className="hover:bg-green-600 rounded-lg ps-5 pe-5 pt-2 pb-2 bg-green-500 m-1 text-white font-semibold text-sm w-full sm:w-auto"
        >
          Pen
        </button>
        <button
          onClick={() => setTool('rect')}
          className="hover:bg-blue-600 rounded-lg ps-5 pe-5 pt-2 pb-2 bg-blue-500 m-1 text-white font-semibold text-sm w-full sm:w-auto"
        >
          Rectangle
        </button>
        <button
          onClick={() => setTool('circle')}
          className="hover:bg-red-600 rounded-lg ps-5 pe-5 pt-2 pb-2 bg-red-500 m-1 text-white font-semibold text-sm w-full sm:w-auto"
        >
          Circle
        </button>
        <button
          onClick={() => setTool('eraser')}
          className="hover:bg-black-600 rounded-lg ps-5 pe-5 pt-2 pb-2 bg-gray-500 m-1 text-white font-semibold text-sm w-full sm:w-auto"
        >
          Eraser
        </button>
      </div>

      {/* Konva Stage */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight * 0.8}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {shapes.map((shape, i) => {
            switch (shape.tool) {
              case 'rect':
                return <Rect key={i} x={shape.points[0]} y={shape.points[1]} width={100} height={50} fill="blue" />;
              case 'circle':
                return <Circle key={i} x={shape.points[0]} y={shape.points[1]} radius={30} fill="red" />;
              default:
                return (
                  <Line
                    key={i}
                    points={shape.points}
                    stroke={shape.tool === 'eraser' ? 'white' : 'black'}
                    strokeWidth={shape.tool === 'eraser' ? 20 : 5}
                    tension={0.5}
                    lineCap="round"
                  />
                );
            }
          })}
          {/* Render the current shape */}
          {currentShape && currentShape.tool === 'pen' && (
            <Line
              points={currentShape.points}
              stroke={currentShape.color}
              strokeWidth={currentShape.tool === 'eraser' ? 20 : 5}
              tension={0.5}
              lineCap="round"
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default WhiteBoard;
