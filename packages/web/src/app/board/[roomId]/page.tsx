"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FaBook,
  FaLink,
  FaHome,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";
import dynamic from "next/dynamic";
import { HexColorPicker } from "react-colorful";
import { nanoid } from "nanoid";
import type Konva from "konva";
import OrbitalSelector from "../../components/OrbitalSelector";
import MobileToolbar from "../../components/MobileToolbar";
import { TOOLS, Tool } from "../../lib/tools";
import { useUser } from "../../hooks/useUser";
import { useRoomCanvas } from "../../hooks/useRoomCanvas";
import type {
  Point,
  RectShape,
  CircleShape,
  Shape,
  LineShape,
  TextShape,
  UserProfile,
  Participant,
} from "../../lib/types";
import { AvatarIcon, AVATAR_PRESETS } from "../../lib/avatars";
import {
  createLineShape,
  createRectShape,
  createCircleShape,
  createTextShape,
} from "../../lib/types";

type ShapeCreators = {
  createLineShape: typeof import("../../lib/types").createLineShape;
  createRectShape: typeof import("../../lib/types").createRectShape;
  createCircleShape: typeof import("../../lib/types").createCircleShape;
  createTextShape: typeof import("../../lib/types").createTextShape;
};

const Whiteboard = dynamic(() => import("../../components/Whiteboard"), {
  ssr: false,
});

interface StageState {
  scale: number;
  x: number;
  y: number;
}

interface MarqueeState {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

// --- FONT PRESET CONSTANT ---
const FONT_PRESETS: Record<string, string> = {
  "JetBrains Mono": "JetBrains Mono, monospace",
  Orbitron: "Orbitron, sansâ€‘serif",
};

// --- FONT WEIGHT CONSTANT (Using 700 for Bold) ---
const FONT_WEIGHTS = [
  { value: 400, label: "Normal" },
  { value: 600, label: "Italic" },
  { value: 700, label: "Bold" },
];

const ExternalFontLoader: React.FC = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Orbitron:wght@400;600;700&display=swap"
    rel="stylesheet"
  />
);

const TextareaStyles = () => (
  <style jsx global>{`
    textarea::placeholder {
      color: rgba(103, 232, 249, 0.4);
      opacity: 1;
    }

    @media (max-width: 768px) {
      textarea {
        font-size: 16px !important;
      }
    }
  `}</style>
);

export default function BoardPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = React.use(params);
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lines, setLines] = useState<Shape[]>([]);
  const [stage, setStage] = useState<StageState>({ scale: 1, x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#67e8f9"); // General shape color
  const [penStrokeWidth, setPenStrokeWidth] = useState(2);
  const [penOpacity, setPenOpacity] = useState(1);
  const [isRectFilled, setIsRectFilled] = useState(false);
  const [isCircleFilled, setIsCircleFilled] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>(TOOLS.PEN);
  const [history, setHistory] = useState<Shape[][]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const [isOrbitalSelectorOpen, setIsOrbitalSelectorOpen] = useState(false);
  const [orbitalSelectorPosition, setOrbitalSelectorPosition] = useState({
    x: 0,
    y: 0,
  });
  const [hoveredTool, setHoveredTool] = useState<Tool | null>(null);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const isDrawing = useRef(false);
  const isEditing = useRef(false);
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage | null>(null);
  const startPoint = useRef<Point | null>(null);
  const marqueeStartPoint = useRef<Point | null>(null);
  const [marquee, setMarquee] = useState<MarqueeState>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    active: false,
  });
  const [editTextId, setEditTextId] = useState<string | null>(null);
  const [textAreaStyle, setTextAreaStyle] = useState<React.CSSProperties>({});
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const { user, saveUser, isLoading: isUserLoading } = useUser();
  const { getCanvasState, saveCanvasState, clearCanvasState } =
    useRoomCanvas(roomId);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(true);
  const [shapeCreators, setShapeCreators] = useState<ShapeCreators | null>(
    null
  );
  const [pendingOpenEditorId, setPendingOpenEditorId] = useState<string | null>(
    null
  );
  const [textColor, setTextColor] = useState("#67e8f9");
  const [sessionId] = useState(nanoid(8));
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState(400);
  const [fontFamily, setFontFamily] = useState(FONT_PRESETS["JetBrains Mono"]);

  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const toggleSidebar = useCallback(() => {
    setIsSidebarVisible((prev) => !prev);
  }, []);

  const [shadowBlur, setShadowBlur] = useState(8);
  const [eraserRadius, setEraserRadius] = useState(20);
  const [eraserPosition, setEraserPosition] = useState<Point | null>(null);

  const [remoteCursors, setRemoteCursors] = useState<
    Record<string, { x: number; y: number; user: UserProfile }>
  >({});

  const historyRef = useRef(history);
  const historyPointerRef = useRef(historyPointer);
  const socketRef = useRef(socket);
  const selectedShapeIdsRef = useRef(selectedShapeIds);
  const fontSizeRef = useRef(fontSize);
  const fontWeightRef = useRef(fontWeight);
  const fontFamilyRef = useRef(fontFamily);
  const lastCursorEmitTime = useRef(0);
  const eraserEmitPending = useRef(false);
  const eraserEmitTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  useEffect(() => {
    historyPointerRef.current = historyPointer;
  }, [historyPointer]);
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);
  useEffect(() => {
    selectedShapeIdsRef.current = selectedShapeIds;
  }, [selectedShapeIds]);
  useEffect(() => {
    fontSizeRef.current = fontSize;
  }, [fontSize]);
  useEffect(() => {
    fontWeightRef.current = fontWeight;
  }, [fontWeight]);
  useEffect(() => {
    fontFamilyRef.current = fontFamily;
  }, [fontFamily]);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      setIsSidebarVisible(!isMobileDevice);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    import("../../lib/types").then((creators) => {
      setShapeCreators({
        createLineShape: creators.createLineShape,
        createRectShape: creators.createRectShape,
        createCircleShape: creators.createCircleShape,
        createTextShape: creators.createTextShape,
      });
    });
  }, []);

  const handleCopyLink = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {
        setIsLinkCopied(true);
        setTimeout(() => {
          setIsLinkCopied(false);
        }, 2000);
      },
      (err) => {
        console.error("Failed to copy link: ", err);
      }
    );
  }, []);

  const handleNewState = useCallback((currentLines: Shape[]) => {
    setHistory((prevHistory) => {
      const currentHistoryPointer = historyPointerRef.current;
      const newHistory = prevHistory.slice(0, currentHistoryPointer + 1);
      const newState = [...currentLines];
      newHistory.push(newState);

      const maxHistorySize = 50;
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        setHistoryPointer(maxHistorySize - 1);
      } else {
        setHistoryPointer(newHistory.length - 1);
      }
      return newHistory;
    });
  }, []);

  const PLACEHOLDER_TEXT = "Double-Click to Edit";

  const handleTextDblClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent> | null) => {
      // --- OPENING THE EDITOR ---
      if (e) {
        if (e.evt) {
          e.evt.preventDefault();
        }

        const textNode = e.target as Konva.Text;
        if (editTextId === textNode.id()) return;

        setEditTextId(textNode.id());
        isEditing.current = true;

        const stage = textNode.getStage();
        if (!stage) return;

        // 1. Calculate geometry
        const stageBox = stage.container().getBoundingClientRect();
        const textBox = textNode.getClientRect();
        const areaPosition = {
          x: stageBox.left + textBox.x,
          y: stageBox.top + textBox.y,
        };
        const domWidth = textBox.width;
        const domHeight = textBox.height;
        const stageScale = stage.scaleX();
        const visualFontSize = textNode.fontSize() * stageScale;

        // 2. Get data from state
        const shape = lines.find((s) => s.id === textNode.id()) as TextShape;
        const shapeColor = shape ? shape.color : textColor;
        const shapeWeight = shape ? shape.fontWeight : 400;

        // 3. Set style (resize: "both" is correct here)
        setTextAreaStyle({
          position: "absolute",
          top: `${areaPosition.y}px`,
          left: `${areaPosition.x}px`,
          width: `${domWidth}px`,
          height: `${domHeight}px`,
          minWidth: "100px",
          minHeight: "30px",
          fontSize: `${visualFontSize}px`,
          fontFamily: textNode.fontFamily(),
          color: shapeColor,
          padding: "5px",
          margin: "0px",
          border: `2px solid ${shapeColor}`,
          outline: "none",
          resize: "both",
          lineHeight: textNode.lineHeight(),
          transformOrigin: "left top",
          transform: `rotate(${textNode.rotation()}deg)`,
          background: "transparent",
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          zIndex: 1001,
          boxSizing: "border-box",
          fontWeight: shapeWeight as number,
          boxShadow: `0 0 10px ${shapeColor}40, inset 0 0 10px ${shapeColor}20`,
        });
      } else {
        // --- CLOSING THE EDITOR ---
        if (!editTextId || !isEditing.current) return;
        isEditing.current = false;

        setLines((prevLines) => {
          const shape = prevLines.find((s) => s.id === editTextId) as TextShape;

          if (shape && textAreaRef.current) {
            let newText = textAreaRef.current.value;
            if (newText.trim() === "") {
              newText = PLACEHOLDER_TEXT;
            }

            const stage = stageRef.current?.getStage();
            if (!stage) return prevLines;

            const stageScale = stage.scaleX();

            // Get the new dimensions from the resized textarea
            const newDomRect = textAreaRef.current.getBoundingClientRect();

            // With border-box, the width/height already includes padding and border
            // Un-scale the DOM pixel dimensions to get the Konva model dimensions
            const newWidth = newDomRect.width / stageScale;
            const newHeight = newDomRect.height / stageScale;

            const textNode = stage.findOne(`#${editTextId}`) as Konva.Text;
            const currentX = textNode ? textNode.x() : shape.x;
            const currentY = textNode ? textNode.y() : shape.y;
            const currentRotation = textNode
              ? textNode.rotation()
              : shape.rotation;

            // Update width, height, text, AND preserve current position/rotation
            const updatedShape = {
              ...shape,
              text: newText,
              width: newWidth,
              height: newHeight,
              x: currentX,
              y: currentY,
              rotation: currentRotation,
            };

            const newLines = prevLines.map((s) =>
              s.id === editTextId ? updatedShape : s
            );

            // Send and save new state
            socketRef.current?.emit("shape-transformed", {
              shape: updatedShape,
              roomId,
            });
            handleNewState(newLines);

            return newLines;
          }
          return prevLines;
        });

        // Clean up
        setEditTextId(null);
        setTextAreaStyle({});
      }
    },
    [editTextId, handleNewState, roomId, lines, textColor]
  );

  // --- Universal Generic Shape Property Updater (for non-text shapes) ---
  const updateSelectedGenericShapeProperty = useCallback(
    (key: keyof (LineShape | RectShape | CircleShape), value: any) => {
      if (selectedShapeIdsRef.current.length === 1) {
        const selectedId = selectedShapeIdsRef.current[0];
        setLines((prevLines) => {
          const shape = prevLines.find((s) => s.id === selectedId);

          if (
            shape &&
            (shape.type === "line" ||
              shape.type === "rect" ||
              shape.type === "circle")
          ) {
            if (shape[key as keyof typeof shape] === value) return prevLines;

            const updatedShape = {
              ...shape,
              [key]: value,
              ...(key === "color" &&
                (shape.type === "rect" || shape.type === "circle") && {
                  fillColor: shape.isFilled ? value : shape.fillColor,
                }),
            };

            const newLines = prevLines.map((s) =>
              s.id === selectedId ? (updatedShape as Shape) : s
            );

            socketRef.current?.emit("shape-transformed", {
              shape: updatedShape,
              roomId,
            });

            return newLines;
          }
          return prevLines;
        });
      }
    },
    [roomId]
  );

  // --- Universal Text Property Updater ---
  const updateSelectedTextShape = useCallback(
    (key: keyof TextShape, value: any) => {
      if (selectedShapeIdsRef.current.length === 1) {
        const selectedId = selectedShapeIdsRef.current[0];
        setLines((prevLines) => {
          const shape = prevLines.find((s) => s.id === selectedId);

          if (shape && shape.type === "text") {
            if (shape[key as keyof typeof shape] === value) return prevLines;

            const updatedShape: TextShape = {
              ...shape,
              [key]: value,
            };

            const newLines = prevLines.map((s) =>
              s.id === selectedId ? updatedShape : s
            );

            socketRef.current?.emit("shape-transformed", {
              shape: updatedShape,
              roomId,
            });

            return newLines;
          }
          return prevLines;
        });
      }
    },
    [roomId]
  );

  const handleFontSizeChange = useCallback(
    (newSize: number) => {
      setFontSize(newSize);
      updateSelectedTextShape("fontSize", newSize);
    },
    [updateSelectedTextShape]
  );

  const handleFontFamilyChange = useCallback(
    (newFamily: string) => {
      setFontFamily(newFamily);
      updateSelectedTextShape("fontFamily", newFamily);
    },
    [updateSelectedTextShape]
  );

  const handleFontWeightChange = useCallback(
    (newWeight: number) => {
      setFontWeight(newWeight);
      updateSelectedTextShape("fontWeight", newWeight);
    },
    [updateSelectedTextShape]
  );

  const handleTextOpacityChange = useCallback(
    (newOpacity: number) => {
      setPenOpacity(newOpacity);
      updateSelectedTextShape("opacity", newOpacity);
    },
    [updateSelectedTextShape]
  );

  useEffect(() => {
    if (!pendingOpenEditorId || !stageRef.current) return;

    const stage = stageRef.current;
    const textNode = stage.findOne(`#${pendingOpenEditorId}`);

    if (textNode) {
      handleTextDblClick({ target: textNode } as any);
      setPendingOpenEditorId(null); // Clear the trigger
    }
  }, [pendingOpenEditorId, lines, handleTextDblClick]);

  useEffect(() => {
    if (selectedShapeIds.length === 1) {
      const selectedShape = lines.find((s) => s.id === selectedShapeIds[0]);

      if (selectedShape && selectedShape.type === "text") {
        setFontSize(selectedShape.fontSize);
        setFontWeight((selectedShape.fontWeight as number) ?? 400);
        setFontFamily(selectedShape.fontFamily);
        setPenOpacity(selectedShape.opacity);
        setTextColor(selectedShape.color);
      } else if (selectedShape) {
        setStrokeColor(selectedShape.color);
        if (
          selectedShape.type === "line" ||
          selectedShape.type === "rect" ||
          selectedShape.type === "circle"
        ) {
          setPenStrokeWidth(selectedShape.strokeWidth);
          setPenOpacity(selectedShape.opacity);
        }
      }
    }
  }, [selectedShapeIds, lines, activeTool]);

  useEffect(() => {
    if (editTextId && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
    }
  }, [editTextId]);

  const handleDeleteSelected = useCallback(() => {
    const idsToDelete = selectedShapeIdsRef.current;
    const currentSocket = socketRef.current;

    if (idsToDelete.length === 0) {
      return;
    }

    setLines((prevShapes) => {
      const newShapes = prevShapes.filter(
        (shape) => !idsToDelete.includes(shape.id)
      );
      handleNewState(newShapes);
      return newShapes;
    });

    setSelectedShapeIds([]);

    idsToDelete.forEach((id) => {
      currentSocket?.emit("delete-shape", { id: id, roomId });
    });
  }, [handleNewState, roomId]);

  const handleUndo = useCallback(() => {
    const currentHistory = historyRef.current;
    const currentHistoryPointer = historyPointerRef.current;

    if (currentHistoryPointer > 0) {
      const newPointer = currentHistoryPointer - 1;
      const previousState = currentHistory[newPointer];
      setLines(previousState);
      setHistoryPointer(newPointer);
    }
  }, []);

  const handleRedo = useCallback(() => {
    const currentHistory = historyRef.current;
    const currentHistoryPointer = historyPointerRef.current;

    if (currentHistoryPointer < currentHistory.length - 1) {
      const newPointer = currentHistoryPointer + 1;
      const nextState = currentHistory[newPointer];
      setLines(nextState);
      setHistoryPointer(newPointer);
    }
  }, []);

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    if (!user || !user.username.trim()) {
      router.replace(`/?roomId=${roomId}`);
      return;
    }

    if (socket) {
      return;
    }

    console.log("Initializing socket connection...");
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const newSocket = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const uniqueUsername = `${user.username}#${sessionId}`;

    const isValidAvatar =
      user.avatar &&
      (AVATAR_PRESETS as readonly string[]).includes(user.avatar);
    const userAvatar = isValidAvatar ? user.avatar : ("robot" as const);

    const uniqueUserProfile: UserProfile = {
      id: (user as UserProfile).id || nanoid(),
      username: uniqueUsername,
      avatar: userAvatar,
    };

    console.log("User profile for socket:", uniqueUserProfile);

    newSocket.on("connect", () => {
      console.log("✅ Connected to Socket.IO server with ID:", newSocket.id);
      console.log("Joining room:", roomId);
      newSocket.emit("join-room", {
        roomId: roomId,
        userProfile: uniqueUserProfile,
      });
    });

    newSocket.on("canvas-state", (serverState: Shape[]) => {
      console.log(
        "📦 Received canvas state from server:",
        serverState.length,
        "shapes"
      );

      const localState = getCanvasState();
      console.log("📂 Local canvas state:", localState.length, "shapes");

      const finalState = serverState.length > 0 ? serverState : localState;
      console.log("✅ Using canvas state with", finalState.length, "shapes");

      setLines(finalState);

      if (serverState.length === 0 && localState.length > 0) {
        console.log("📤 Server empty, uploading local state");
        newSocket.emit("canvas-state-update", { shapes: localState, roomId });
      } else if (serverState.length > 0) {
        console.log("✅ Using server state as source of truth");
      }

      // Initialize history
      if (historyRef.current.length === 0 && finalState.length > 0) {
        handleNewState(finalState);
      } else if (historyRef.current.length === 0) {
        handleNewState([]);
      }
    });

    newSocket.on("room-participants", (allParticipants: Participant[]) => {
      console.log(
        "👥 Received participant list:",
        allParticipants.length,
        "participants"
      );
      allParticipants.forEach((p) => {
        console.log(
          `  - ${p.profile.username} (${p.id}) - Avatar: ${p.profile.avatar}`
        );
      });
      setParticipants(allParticipants);
    });

    newSocket.on("start-drawing", (newShape: Shape) => {
      setLines((prevShapes) => {
        // Check if shape already exists (prevent duplicates)
        const shapeExists = prevShapes.some((s) => s.id === newShape.id);
        if (shapeExists) {
          return prevShapes;
        }
        return [...prevShapes, newShape];
      });
    });

    newSocket.on("drawing", (point: Point) => {
      setLines((prevShapes) => {
        const newShapes = [...prevShapes];
        const lastShape = newShapes[newShapes.length - 1];
        if (lastShape && lastShape.type === "line") {
          lastShape.points.push(point);
        }
        return newShapes;
      });
    });

    newSocket.on("drawing-shape-update", (updatedShape: Shape) => {
      setLines((prevShapes) => {
        const newShapes = [...prevShapes];
        const shapeIndex = newShapes.findIndex((s) => s.id === updatedShape.id);
        if (shapeIndex !== -1) {
          newShapes[shapeIndex] = updatedShape;
        } else {
          newShapes.push(updatedShape);
        }
        return newShapes;
      });
    });

    newSocket.on("shape-transformed", (transformedShape: Shape) => {
      setLines((prevShapes) =>
        prevShapes.map((shape) =>
          shape.id === transformedShape.id ? transformedShape : shape
        )
      );
    });

    newSocket.on("finish-drawing", () => {
      isDrawing.current = false;
    });

    newSocket.on("shape-deleted", (deletedShapeId: string) => {
      setLines((prevShapes) =>
        prevShapes.filter((shape) => shape.id !== deletedShapeId)
      );
      setSelectedShapeIds((prevIds) =>
        prevIds.filter((id) => id !== deletedShapeId)
      );
    });

    newSocket.on("clear", () => {
      setLines([]);
      clearCanvasState();
    });

    newSocket.on("disconnect", (reason: string) => {
      console.log("❌ Disconnected from Socket.IO server. Reason:", reason);
      if (reason === "io server disconnect") {
        // Server forced disconnect, try to reconnect
        console.log("🔄 Attempting to reconnect...");
        newSocket.connect();
      }
    });

    newSocket.on("reconnect", (attemptNumber: number) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      newSocket.emit("join-room", {
        roomId: roomId,
        userProfile: uniqueUserProfile,
      });
    });

    newSocket.on("reconnect_error", (error: Error) => {
      console.error("🔴 Reconnection error:", error.message);
    });

    newSocket.on("reconnect_failed", () => {
      console.error("🔴 Reconnection failed after all attempts");
      setToast("Connection lost. Please refresh the page.");
    });

    newSocket.on("room-full", () => {
      console.log("🚫 Room is full!");
      setIsRoomFull(true);
      setToast("Room is full! Cannot join.");
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(
        () => setToast(null),
        3000
      ) as unknown as number;
    });

    newSocket.on("connect_error", (error: Error) => {
      console.error("Connection error:", error);
    });

    // Cursor tracking events
    newSocket.on(
      "cursor-move",
      ({
        userId,
        x,
        y,
        user,
      }: {
        userId: string;
        x: number;
        y: number;
        user: UserProfile;
      }) => {
        setRemoteCursors((prev) => ({
          ...prev,
          [userId]: { x, y, user },
        }));
      }
    );

    newSocket.on("cursor-leave", (userId: string) => {
      setRemoteCursors((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });
    setSocket(newSocket);

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up socket connection");
      newSocket.disconnect();
    };
  }, [roomId, isUserLoading, user, handleNewState, sessionId, router]);

  // --- AUTO-SAVE TO LOCALSTORAGE ---
  useEffect(() => {
    // Save canvas state to localStorage whenever lines change
    if (lines.length > 0) {
      saveCanvasState(lines);
    } else {
      // If lines is empty, clear localStorage
      clearCanvasState();
    }
  }, [lines, saveCanvasState, clearCanvasState]);

  // --- Toggle Sidebar with ALT Key ---
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Check if Alt key is pressed, and not in an input/textarea
      const activeEl = document.activeElement;
      const isTyping =
        activeEl &&
        (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");

      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && !isTyping) {
        e.preventDefault();
        setIsSidebarVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isSidebarVisible]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [handleUndo, handleRedo, handleDeleteSelected]);

  useEffect(() => {
    if (activeTool !== TOOLS.SELECT) {
      setSelectedShapeIds([]);
    }
    if (activeTool !== TOOLS.ERASER) {
      setEraserPosition(null);
    }
  }, [activeTool]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setIsSpacePressed(true);
        const stageEl = stageRef.current?.getStage()?.container();
        if (stageEl) stageEl.style.cursor = "grab";
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setIsSpacePressed(false);
        const stageEl = stageRef.current?.getStage()?.container();
        if (stageEl) stageEl.style.cursor = "default";
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const labels: Record<string, string> = {
      [TOOLS.PEN]: "Pen",
      [TOOLS.SELECT]: "Select",
      [TOOLS.ERASER]: "Eraser",
      [TOOLS.CIRCLE]: "Circle",
      [TOOLS.RECTANGLE]: "Rectangle",
      [TOOLS.TEXT]: "Text",
      [TOOLS.LINE]: "Line",
    };
    const keyMap: Record<string, Tool> = {
      p: TOOLS.PEN,
      s: TOOLS.SELECT,
      e: TOOLS.ERASER,
      c: TOOLS.CIRCLE,
      r: TOOLS.RECTANGLE,
      l: TOOLS.LINE,
      t: TOOLS.TEXT,
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          (activeEl as HTMLElement).isContentEditable)
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (editTextId) {
        if (e.key === "Escape") {
          handleTextDblClick(null);
        }
        return;
      }
      const k = e.key.toLowerCase();
      const tool = keyMap[k];
      if (tool) {
        setActiveTool(tool);
        if (showManual) {
          setShowManual(false);
        }
        setToast(labels[tool]);
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(
          () => setToast(null),
          1400
        ) as unknown as number;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, [showManual, editTextId, handleTextDblClick]);

  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        if (isOrbitalSelectorOpen) {
          e.preventDefault();
          if (hoveredTool) {
            setActiveTool(hoveredTool);
            setShowManual(false);
          }
          setIsOrbitalSelectorOpen(false);
          setHoveredTool(null);
        }
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isOrbitalSelectorOpen, hoveredTool, activeTool]);

  const getRelativePointerPosition = (): Point => {
    const stage = stageRef.current?.getStage();
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return { x: 0, y: 0 };
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(pointer);
  };

  const handleSelectShape = useCallback(
    (id: string | null, isMultiSelect: boolean = false) => {
      setSelectedShapeIds((prevIds) => {
        if (!id) {
          return [];
        }
        if (isMultiSelect) {
          if (prevIds.includes(id)) {
            return prevIds.filter((prevId) => prevId !== id);
          } else {
            return [...prevIds, id];
          }
        } else {
          return [id];
        }
      });
    },
    []
  );

  const handleTransformEnd = useCallback(
    (transformedShape: Shape) => {
      if (transformedShape.type === "text") {
        const node = stageRef.current?.findOne(
          `#${transformedShape.id}`
        ) as Konva.Text;
        if (node) {
          transformedShape.width = node.width() * node.scaleX();
          transformedShape.height = node.height() * node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
        }
      }
      let newShapes: Shape[] = [];
      setLines((prevShapes) => {
        newShapes = prevShapes.map((shape) =>
          shape.id === transformedShape.id ? transformedShape : shape
        );
        return newShapes;
      });
      socketRef.current?.emit("shape-transformed", {
        shape: transformedShape,
        roomId,
      });
      setTimeout(() => {
        handleNewState(newShapes);
      }, 0);
    },
    [roomId, handleNewState]
  );

  // --- Handler for Double-Click on Stage (to create text) ---
  const handleStageDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== TOOLS.TEXT) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const isBackground = e.target === stage || e.target.id?.() === "background";
    if (!isBackground) return;

    if (!shapeCreators) return;

    // pointerPos in DOM canvas pixels
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Convert to stage coordinates (handles zoom/pan)
    const pos = stage.getAbsoluteTransform().copy().invert().point(pointerPos);

    const newShapeId = nanoid();

    const newText = createTextShape(
      newShapeId,
      pos.x,
      pos.y,
      textColor,
      fontSizeRef.current,
      fontFamilyRef.current,
      fontWeightRef.current,
      penOpacity
    );

    const newLines = [...lines, newText];
    setLines(newLines);
    socketRef.current?.emit("start-drawing", { ...newText, roomId });
    handleNewState(newLines);

    setSelectedShapeIds([newText.id]);

    // Ensure the Konva node is rendered before we try to open editor
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPendingOpenEditorId(newShapeId);
      });
    });

    isDrawing.current = false;
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isOrbitalSelectorOpen && e.evt.button === 0) {
      setIsOrbitalSelectorOpen(false);
      setHoveredTool(null);
      return;
    }

    if (editTextId) {
      handleTextDblClick(null);
      return;
    }
    if (e.evt.button === 2) {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      window.addEventListener(
        "contextmenu",
        (ev) => {
          ev.preventDefault();
        },
        { once: true }
      );
      setOrbitalSelectorPosition({ x: e.evt.clientX, y: e.evt.clientY });
      setIsOrbitalSelectorOpen(true);
      setHoveredTool(activeTool);
      setSelectedShapeIds([]);
      return;
    }

    if (isSpacePressed) {
      isPanning.current = true;
      const stageObj = e.target.getStage && e.target.getStage();
      if (!stageObj) return;
      const pointerPos = stageObj.getPointerPosition();
      if (!pointerPos) return;
      lastPanPoint.current = { x: pointerPos.x, y: pointerPos.y };
      const stageEl = stageRef.current?.container();
      if (stageEl)
        (stageEl as unknown as HTMLDivElement).style.cursor = "grabbing";
      setSelectedShapeIds([]);
      return;
    }

    // --- SELECTION LOGIC (for SELECT and TEXT tools) ---
    if (activeTool === TOOLS.SELECT || activeTool === TOOLS.TEXT) {
      const clickedOnTransformer =
        e.target.name() === "transformer" ||
        e.target.findAncestor(".transformer");

      if (clickedOnTransformer) {
        return;
      }

      const isBackground =
        e.target === e.target.getStage() || e.target.id?.() === "background";

      if (isBackground) {
        const stage = stageRef.current?.getStage();
        if (selectedShapeIds.length > 0 && stage) {
          const tr = stage.findOne(".transformer");
          if (tr) {
            const trBox = tr.getClientRect();
            const pos = getRelativePointerPosition();
            const isInside =
              pos.x >= trBox.x &&
              pos.x <= trBox.x + trBox.width &&
              pos.y >= trBox.y &&
              pos.y <= trBox.y + trBox.height;
            if (isInside) {
              tr.startDrag(e);
              return;
            }
          }
        }

        if (activeTool === TOOLS.SELECT) {
          const pos = getRelativePointerPosition();
          marqueeStartPoint.current = pos;
          setMarquee({ x: pos.x, y: pos.y, width: 0, height: 0, active: true });
          if (!e.evt.ctrlKey && !e.evt.metaKey && !e.evt.shiftKey) {
            setSelectedShapeIds([]);
          }
          isDrawing.current = true;
        } else {
          setSelectedShapeIds([]);
        }
      } else {
        const clickedShapeId = e.target.id();
        if (clickedShapeId) {
          const isMultiSelect =
            e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey;
          const isAlreadySelected = selectedShapeIds.includes(clickedShapeId);
          if (isMultiSelect) {
            handleSelectShape(clickedShapeId, true);
          } else if (isAlreadySelected) {
            return;
          } else {
            handleSelectShape(clickedShapeId, false);
          }
        } else {
          setSelectedShapeIds([]);
        }
      }
      return;
    }
    // --- END OF SELECTION LOGIC ---

    if (activeTool === TOOLS.ERASER) {
      isDrawing.current = true;
      const pos = getRelativePointerPosition();
      // eraserPath.current = [pos]; // Assuming eraserPath is a ref for points
      return;
    }

    if (!shapeCreators) return;

    setSelectedShapeIds([]);
    isDrawing.current = true;
    const pos = getRelativePointerPosition();
    startPoint.current = pos;

    if (activeTool === TOOLS.PEN) {
      const newLine = createLineShape(
        nanoid(),
        pos,
        strokeColor,
        penStrokeWidth,
        penOpacity
      );
      setLines((prevShapes) => [...prevShapes, newLine]);
      socketRef.current?.emit("start-drawing", { ...newLine, roomId });
    } else if (activeTool === TOOLS.RECTANGLE) {
      const newRect = createRectShape(
        nanoid(),
        pos.x,
        pos.y,
        strokeColor,
        strokeColor,
        penStrokeWidth,
        penOpacity,
        isRectFilled
      );
      setLines((prevShapes) => [...prevShapes, newRect]);
      socketRef.current?.emit("start-drawing", { ...newRect, roomId });
    } else if (activeTool === TOOLS.CIRCLE) {
      const newCircle = createCircleShape(
        nanoid(),
        pos.x,
        pos.y,
        strokeColor,
        strokeColor,
        penStrokeWidth,
        penOpacity,
        isCircleFilled
      );
      setLines((prevShapes) => [...prevShapes, newCircle]);
      socketRef.current?.emit("start-drawing", { ...newCircle, roomId });
    } else if (activeTool === TOOLS.LINE) {
      const newLine = createLineShape(
        nanoid(),
        pos,
        strokeColor,
        penStrokeWidth,
        penOpacity
      );
      setLines((prevShapes) => [...prevShapes, newLine]);
      socketRef.current?.emit("start-drawing", { ...newLine, roomId });
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // --- Update eraser position for visual indicator ---
    if (activeTool === TOOLS.ERASER) {
      const pos = getRelativePointerPosition();
      setEraserPosition(pos);
    } else {
      setEraserPosition(null);
    }

    // --- Emit cursor position to other users (throttled to 50ms) ---
    const now = Date.now();
    if (now - lastCursorEmitTime.current > 50) {
      const pos = getRelativePointerPosition();
      if (socketRef.current && user) {
        socketRef.current.emit("cursor-move", {
          roomId,
          x: pos.x,
          y: pos.y,
          user: {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
          },
        });
        lastCursorEmitTime.current = now;
      }
    }

    // --- (Marquee, Panning, and Eraser logic at the top is all correct) ---
    if (marquee.active && marqueeStartPoint.current) {
      const pos = getRelativePointerPosition();
      const x = Math.min(marqueeStartPoint.current.x, pos.x);
      const y = Math.min(marqueeStartPoint.current.y, pos.y);
      const width = Math.abs(pos.x - marqueeStartPoint.current.x);
      const height = Math.abs(pos.y - marqueeStartPoint.current.y);
      setMarquee((prev) => ({ ...prev, x, y, width, height }));
    }

    if (isPanning.current && isSpacePressed) {
      const stageInstance = stageRef.current?.getStage();
      if (!stageInstance) return;
      const newPointerPos = stageInstance.getPointerPosition();
      if (!newPointerPos) return;
      const dx = newPointerPos.x - lastPanPoint.current.x;
      const dy = newPointerPos.y - lastPanPoint.current.y;
      setStage((prevStage) => ({
        ...prevStage,
        x: prevStage.x + dx,
        y: prevStage.y + dy,
      }));
      lastPanPoint.current = newPointerPos;
      return;
    }

    // --- ERASER LOGIC: Erase pixels from pen strokes ---
    if (activeTool === TOOLS.ERASER && isDrawing.current) {
      const currentPos = getRelativePointerPosition();

      setLines((prevShapes) => {
        const newShapes: Shape[] = [];
        let modified = false;
        const shapesToDelete: string[] = [];
        const shapesToCreate: Shape[] = [];

        prevShapes.forEach((shape) => {
          // Erase from line shapes (pen strokes)
          if (shape.type === "line" && shape.points.length > 1) {
            const segments: Point[][] = [];
            let currentSegment: Point[] = [];
            let wasErased = false;

            // Check each point and line segment
            for (let i = 0; i < shape.points.length; i++) {
              const point = shape.points[i];
              const dx = point.x - currentPos.x;
              const dy = point.y - currentPos.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              // Check if point is within eraser radius
              if (distance <= eraserRadius) {
                wasErased = true;
                // If we were building a segment, save it
                if (currentSegment.length >= 2) {
                  segments.push([...currentSegment]);
                }
                currentSegment = [];
              } else {
                // Point is outside eraser, add to current segment
                currentSegment.push(point);

                // Also check if the line segment crosses the eraser circle
                if (i > 0 && currentSegment.length >= 2) {
                  const prevPoint = shape.points[i - 1];
                  const prevDx = prevPoint.x - currentPos.x;
                  const prevDy = prevPoint.y - currentPos.y;
                  const prevDistance = Math.sqrt(
                    prevDx * prevDx + prevDy * prevDy
                  );

                  // If previous point was outside and current is outside,
                  // but the line between them crosses the eraser circle
                  if (prevDistance > eraserRadius) {
                    // Check if line segment intersects with circle
                    const intersects = lineCircleIntersection(
                      prevPoint,
                      point,
                      currentPos,
                      eraserRadius
                    );
                    if (intersects) {
                      wasErased = true;
                      // Split the segment
                      if (currentSegment.length > 1) {
                        currentSegment.pop(); // Remove the current point
                        if (currentSegment.length >= 2) {
                          segments.push([...currentSegment]);
                        }
                        currentSegment = [point];
                      }
                    }
                  }
                }
              }
            }

            // Save the last segment if it exists
            if (currentSegment.length >= 2) {
              segments.push(currentSegment);
            }
            if (wasErased) {
              modified = true;
              if (segments.length === 0) {
                // Line completely erased, mark for deletion
                shapesToDelete.push(shape.id);
              } else {
                // Delete the original and create new segment(s)
                shapesToDelete.push(shape.id);

                segments.forEach((segmentPoints) => {
                  if (segmentPoints.length >= 2) {
                    const newLineShape: LineShape = {
                      ...shape,
                      id: nanoid(),
                      points: segmentPoints,
                    };
                    newShapes.push(newLineShape);
                    shapesToCreate.push(newLineShape);
                  }
                });
              }
            } else {
              // No erasure occurred, keep the original shape
              newShapes.push(shape);
            }
          } else if (shape.type === "rect") {
            // Check if eraser intersects with rectangle
            const rect = shape as RectShape;
            const rectCenterX = rect.x;
            const rectCenterY = rect.y;

            // Check if eraser center is within the rectangle bounds
            const halfWidth = rect.width / 2;
            const halfHeight = rect.height / 2;

            // Simple AABB (Axis-Aligned Bounding Box) collision
            const distX = Math.abs(currentPos.x - rectCenterX);
            const distY = Math.abs(currentPos.y - rectCenterY);

            if (
              distX <= halfWidth + eraserRadius &&
              distY <= halfHeight + eraserRadius
            ) {
              // Eraser touches rectangle, mark for deletion
              modified = true;
              shapesToDelete.push(shape.id);
            } else {
              newShapes.push(shape);
            }
          } else if (shape.type === "circle") {
            // Check if eraser intersects with circle
            const circle = shape as CircleShape;
            const dx = circle.x - currentPos.x;
            const dy = circle.y - currentPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If eraser touches the circle, mark for deletion
            if (distance <= circle.radius + eraserRadius) {
              modified = true;
              shapesToDelete.push(shape.id);
            } else {
              newShapes.push(shape);
            }
          } else if (shape.type === "text") {
            // Check if eraser intersects with text
            const text = shape as TextShape;
            const dx = text.x - currentPos.x;
            const dy = text.y - currentPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // If eraser touches the text (approximate with radius), mark for deletion
            if (distance <= eraserRadius + 20) {
              modified = true;
              shapesToDelete.push(shape.id);
            } else {
              newShapes.push(shape);
            }
          } else {
            // Keep other shapes unchanged
            newShapes.push(shape);
          }
        });

        // Store the final state for later
        const finalState = modified ? newShapes : prevShapes;
        // Emit socket events if modified (debounced to prevent duplicate emissions)
        if (modified && socketRef.current) {
          // Clear any pending frame
          if (eraserEmitTimeoutRef.current !== null) {
            cancelAnimationFrame(eraserEmitTimeoutRef.current);
          }
          // Schedule emission using requestAnimationFrame (avoids CSP issues)
          eraserEmitTimeoutRef.current = requestAnimationFrame(() => {
            // First, emit all deletions
            shapesToDelete.forEach((id) => {
              socketRef.current?.emit("delete-shape", {
                id,
                roomId,
              });
            });
            // Then, emit all new shapes (from split lines)
            shapesToCreate.forEach((shape) => {
              socketRef.current?.emit("start-drawing", {
                ...shape,
                roomId,
              });
            });
            // Update history with the final state
            handleNewState(finalState);
            eraserEmitTimeoutRef.current = null;
          });
        }
        return finalState;
      });
      return;
    }

    // Helper function to check line-circle intersection
    function lineCircleIntersection(
      p1: Point,
      p2: Point,
      center: Point,
      radius: number
    ): boolean {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const fx = p1.x - center.x;
      const fy = p1.y - center.y;
      const a = dx * dx + dy * dy;
      const b = 2 * (fx * dx + fy * dy);
      const c = fx * fx + fy * fy - radius * radius;
      const discriminant = b * b - 4 * a * c;
      if (discriminant < 0) {
        return false; // No intersection
      }
      const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
      const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
      // Check if intersection occurs within the line segment (t between 0 and 1)
      return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    }
    // Guard clause for drawing
    if (
      !isDrawing.current ||
      isOrbitalSelectorOpen ||
      activeTool === (TOOLS.SELECT as Tool) ||
      activeTool === TOOLS.ERASER ||
      activeTool === TOOLS.TEXT
    ) {
      return;
    }
    const currentPos = getRelativePointerPosition();
    let shapeToEmit: Shape | null = null; // This will hold the full shape
    // Get the last shape from state
    const lastShape = lines[lines.length - 1];
    if (!lastShape) return;
    if (activeTool === TOOLS.PEN) {
      setLines((prevShapes) => {
        const lastPenShape = prevShapes[prevShapes.length - 1];
        if (lastPenShape && lastPenShape.type === "line") {
          const updatedLastShape = {
            ...lastPenShape,
            points: [...lastPenShape.points, currentPos],
          };
          return [...prevShapes.slice(0, -1), updatedLastShape];
        }
        return prevShapes;
      });
      // Pen emits a "drawing" event, not "drawing-shape-update"
      socketRef.current?.emit("drawing", { ...currentPos, roomId });

      // ---
      // Handle LINE tool
      // ---
    } else if (
      activeTool === TOOLS.LINE &&
      lastShape.type === "line" &&
      startPoint.current
    ) {
      const newPoints = [lastShape.points[0], currentPos];
      shapeToEmit = { ...lastShape, points: newPoints };

      // ---
      // Handle RECTANGLE tool
      // ---
    } else if (
      activeTool === TOOLS.RECTANGLE &&
      lastShape.type === "rect" &&
      startPoint.current
    ) {
      const sx = startPoint.current.x;
      const sy = startPoint.current.y;
      shapeToEmit = {
        ...lastShape,
        x: Math.min(sx, currentPos.x),
        y: Math.min(sy, currentPos.y),
        width: Math.abs(currentPos.x - sx),
        height: Math.abs(currentPos.y - sy),
      };

      // ---
      // Handle CIRCLE tool
      // ---
    } else if (
      activeTool === TOOLS.CIRCLE &&
      lastShape.type === "circle" &&
      startPoint.current
    ) {
      const dx = currentPos.x - startPoint.current.x;
      const dy = currentPos.y - startPoint.current.y;
      shapeToEmit = {
        ...lastShape,
        radius: Math.sqrt(dx * dx + dy * dy),
      };
    }

    // ---
    // Now, if shapeToEmit was created, update state AND emit
    // ---
    if (shapeToEmit) {
      // 1. Update local state
      setLines((prevShapes) => [...prevShapes.slice(0, -1), shapeToEmit!]);

      // 2. Emit to socket
      socketRef.current?.emit("drawing-shape-update", {
        shape: shapeToEmit,
        roomId,
      });
    }
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isOrbitalSelectorOpen && e.evt.button === 2) {
      return;
    }

    if (activeTool === TOOLS.SELECT && marquee.active) {
      const stageInstance = stageRef.current?.getStage();
      if (!stageInstance) {
        console.warn("Stage instance not available for marquee selection.");
        return;
      }
      const marqueeRect = {
        x: marquee.x,
        y: marquee.y,
        width: marquee.width,
        height: marquee.height,
      };
      const layer = stageInstance.findOne(".main-layer");
      const selectedIds: string[] = [];
      if (layer && layer.getClassName() === "Layer") {
        const layerNode = layer as Konva.Layer;
        layerNode.children.forEach((node) => {
          if (node.id() === "background" || node.name() === "transformer") {
            return;
          }
          const shapeRect = node.getClientRect();
          const overlap = !(
            shapeRect.x > marqueeRect.x + marqueeRect.width ||
            shapeRect.x + shapeRect.width < marqueeRect.x ||
            shapeRect.y > marqueeRect.y + marqueeRect.height ||
            shapeRect.y + shapeRect.height < marqueeRect.y
          );
          if (overlap) {
            selectedIds.push(node.id());
          }
        });
      }
      console.debug("handleMouseUp: Shapes found by marquee:", selectedIds);
      if (e.evt.ctrlKey || e.evt.metaKey) {
        setSelectedShapeIds((prev) =>
          Array.from(new Set([...prev, ...selectedIds]))
        );
      } else {
        setSelectedShapeIds(selectedIds);
      }
      setMarquee((m) => ({ ...m, active: false }));
      marqueeStartPoint.current = null;
      isDrawing.current = false;
    }

    if (activeTool === TOOLS.ERASER && isDrawing.current) {
      // Eraser: Save to history when done erasing
      setLines((currentLines) => {
        handleNewState(currentLines);
        return currentLines;
      });
      isDrawing.current = false;
      return;
    }

    if (isDrawing.current) {
      if (
        activeTool === TOOLS.PEN ||
        activeTool === TOOLS.RECTANGLE ||
        activeTool === TOOLS.CIRCLE ||
        activeTool === TOOLS.LINE
      ) {
        setLines((currentLines) => {
          handleNewState(currentLines);
          return currentLines;
        });
        socketRef.current?.emit("finish-drawing");
      }
    }

    isDrawing.current = false;
    isPanning.current = false;
    startPoint.current = null;
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stageInstance = stageRef.current?.getStage();
    if (!stageInstance) return;
    const scaleBy = 1.1;
    const minScale = 0.1;
    const maxScale = 2;
    const oldScale = stage.scale;
    const pointer = stageInstance.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - stage.x) / oldScale,
      y: (pointer.y - stage.y) / oldScale,
    };
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(minScale, Math.min(newScale, maxScale));
    setStage((prevStage) => ({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }));
  };

  const handleClear = () => {
    // Clear local state
    setLines([]);
    // Clear canvas state from localStorage
    clearCanvasState();
    // Clear history
    handleNewState([]);
    // Notify server to clear for all users
    if (socketRef.current) {
      socketRef.current.emit("clear", roomId);
    }
  };

  const handleOrbitalHover = useCallback((tool: Tool | null) => {
    setHoveredTool(tool);
  }, []);

  const handleGoHome = useCallback(() => {
    router.push("/");
  }, [router]);

  if (isUserLoading || !shapeCreators) {
    return <div className="h-screen w-screen bg-[#0a0a0a]" />;
  }

  let initialTextValue = "";
  let placeholderValue = "";

  if (editTextId) {
    const shape = lines.find((s) => s.id === editTextId);
    if (shape && shape.type === "text") {
      if (shape.text === PLACEHOLDER_TEXT) {
        initialTextValue = "";
        placeholderValue = PLACEHOLDER_TEXT;
      } else {
        initialTextValue = shape.text;
      }
    }
  }

  const uniqueParticipants = Array.from(
    participants.reduce((map, participant) => {
      if (!map.has(participant.profile.id)) {
        map.set(participant.profile.id, participant);
      }
      return map;
    }, new Map<string, Participant>())
  ).map(([, participant]) => participant);

  return (
    <>
      <ExternalFontLoader />
      <TextareaStyles />
      <div className="flex flex-col h-screen w-screen bg-[#000510] overflow-hidden relative">
        {/* Holographic background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.03),transparent_50%)] pointer-events-none" />

        {/* Top Bar - Holographic navbar */}
        <div className="relative p-2 text-center text-sm text-cyan-100/90 border-b border-cyan-400/40 bg-black/40 backdrop-blur-xl flex justify-between items-center px-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />

          <div className="flex-1 text-left flex items-center gap-2 relative z-10">
            <button
              onClick={handleCopyLink}
              title="Copy share link"
              className={`relative ${
                isMobile ? "p-2" : "px-3 py-1.5"
              } bg-gradient-to-br ${
                isLinkCopied
                  ? "from-green-500/30 to-green-600/30 border-green-400/40"
                  : "from-cyan-500/20 to-cyan-600/20 border-cyan-400/40"
              } ${
                isLinkCopied ? "text-green-400" : "text-cyan-300"
              } rounded-md hover:from-cyan-500/30 hover:to-cyan-600/30 active:from-cyan-500/40 active:to-cyan-600/40 border transition-all text-xs font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] backdrop-blur-sm z-50`}
            >
              <FaLink
                size={12}
                className={isLinkCopied ? "animate-pulse" : ""}
              />
              {!isMobile &&
                (isLinkCopied ? (
                  <span className="text-green-400 animate-pulse">Copied!</span>
                ) : (
                  <span>Copy Link</span>
                ))}
            </button>
            <button
              onClick={() => setShowParticipantsList((prev) => !prev)}
              title="Toggle Participants List"
              className={`relative ${
                isMobile ? "p-2" : "px-3 py-1.5"
              } bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 text-cyan-300 rounded-md hover:from-cyan-500/30 hover:to-cyan-600/30 active:from-cyan-500/40 active:to-cyan-600/40 border border-cyan-400/40 transition-all text-xs font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] backdrop-blur-sm z-50`}
            >
              <FaUsers size={12} />
              {!isMobile && (
                <span className="text-xs">( {uniqueParticipants.length} )</span>
              )}
            </button>
            <div
              className={`flex items-center gap-2 transition-all duration-300 ease-in-out overflow-hidden
                          ${
                            showParticipantsList
                              ? `${
                                  isMobile ? "max-w-[200px]" : "max-w-xs"
                                } opacity-100`
                              : "max-w-0 opacity-0"
                          }`}
            >
              {showParticipantsList &&
                uniqueParticipants.map((participant) => (
                  <span
                    key={participant.profile.id}
                    className="inline-flex items-center justify-center h-7 w-7 flex-shrink-0 rounded-full ring-2 ring-cyan-400/40 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 backdrop-blur-sm transition-all text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:scale-110"
                    title={participant.profile.username.split("#")[0]}
                    aria-label={`${
                      participant.profile.username.split("#")[0]
                    }'s avatar`}
                  >
                    <AvatarIcon
                      avatar={participant.profile.avatar}
                      className="h-3.5 w-3.5 flex-shrink-0"
                    />
                  </span>
                ))}
            </div>
          </div>
          <div className="flex-1 text-center relative z-10">
            <strong className="text-cyan-400/80">
              {isMobile ? "" : "Board :"}
            </strong>{" "}
            <span
              className={`font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-cyan-300 ${
                isMobile ? "text-xs" : "animate-pulse"
              }`}
            >
              {roomId}
            </span>
          </div>
          <div className="flex-1 text-right flex items-center justify-end gap-2 relative z-10">
            <button
              onClick={handleGoHome}
              className={`${
                isMobile ? "p-2" : "px-3 py-1.5"
              } bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 text-cyan-300 rounded-md hover:from-cyan-500/30 hover:to-cyan-600/30 active:from-cyan-500/40 active:to-cyan-600/40 border border-cyan-400/40 transition-all text-xs font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] backdrop-blur-sm z-50`}
              title="Go to Home Page"
            >
              <FaHome size={16} />
            </button>
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 text-cyan-300 rounded-md hover:from-cyan-500/30 hover:to-cyan-600/30 active:from-cyan-500/40 active:to-cyan-600/40 border border-cyan-400/40 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] backdrop-blur-sm z-50"
                aria-label="Open menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Textarea Overlay */}
        {editTextId && (
          <textarea
            ref={textAreaRef}
            style={textAreaStyle}
            defaultValue={initialTextValue}
            placeholder={placeholderValue}
            onBlur={() => handleTextDblClick(null)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Escape") {
                handleTextDblClick(null);
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          />
        )}

        {/* Mobile Overlay */}
        {isMobile && isSidebarVisible && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content (Container for Sidebar + Canvas) */}
        <div className="flex flex-row h-full overflow-hidden relative">
          {/* Left Toolbar - COLLAPSIBLE */}
          <div
            className={`
              ${isMobile ? "fixed" : "absolute"} z-20 
              flex-shrink-0 ${isMobile ? "w-64" : "w-56"} h-full 
              bg-gradient-to-b from-black/70 via-black/60 to-black/70 backdrop-blur-2xl border-r border-cyan-400/40 
              transition-all duration-300 ease-in-out
              shadow-[4px_0_30px_rgba(6,182,212,0.2)]
              before:absolute before:inset-0 before:bg-gradient-to-b before:from-cyan-500/5 before:via-purple-500/5 before:to-cyan-500/5 before:pointer-events-none
              ${isSidebarVisible ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <div className="p-4 flex flex-col items-center h-full relative z-10 gap-4">
              {/* Close button for mobile */}
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="absolute top-4 right-4 p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-md border border-cyan-400/40 transition-all"
                  aria-label="Close menu"
                >
                  <svg
                    className="w-5 h-5 text-cyan-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}

              <p className="font-semibold text-base text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Manual
              </p>

              <button
                title={showManual ? "Close user manual" : "Open user manual"}
                onClick={() => setShowManual((s) => !s)}
                aria-pressed={showManual}
                aria-label={
                  showManual ? "Close user manual" : "Open user manual"
                }
                className={`w-10 h-10 rounded-md flex items-center justify-center cursor-pointer transition-all border backdrop-blur-sm ${
                  showManual
                    ? "bg-gradient-to-br from-cyan-500 to-cyan-600 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                    : "bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
                }`}
              >
                <FaBook
                  size={18}
                  aria-hidden
                  color={showManual ? "#000000" : "#67e8f9"}
                />
              </button>

              <div className="flex-1 overflow-y-auto min-h-0 w-full h-full space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {showManual ? (
                  <div className="text-center w-full space-y-5 p-4 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 h-full rounded-md text-sm text-cyan-100/80 border border-cyan-400/20 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]">
                    {/* 1. Title */}
                    <div className="flex items-center justify-center"></div>

                    {/* 3. Basic Controls */}
                    <div className="space-y-2.5 text-left">
                      <p className="text-xs font-semibold">Getting Started</p>
                      <p className="text-xs">
                        <strong className="font-semibold">
                          Hold Right-Click
                        </strong>{" "}
                        anywhere on the canvas to open the tool selector. Hover
                        and release to select, or use Numpad
                      </p>
                    </div>

                    {/* 4. Keyboard Shortcuts */}
                    <div className="space-y-2.5 text-left">
                      <p className="text-xs font-semibold">
                        Keyboard Shortcuts
                      </p>
                      <ul className="text-xs list-disc list-inside space-y-1">
                        <li>P - Pen</li>
                        <li>S - Select - Delete</li>
                        <li>C - Circle</li>
                        <li>R - Rectangle</li>
                        <li>L - Line</li>
                        <li>T - Text</li>
                        <li>Ctrl+Z - Undo</li>
                        <li>Ctrl+Y - Redo</li>
                        <li>Alt - Toggle Left Bar</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Zoom Controls */}
                    <div className="text-center w-full space-y-3">
                      <p className="text-sm text-cyan-100/90 font-semibold mb-2">
                        Zoom Controls
                      </p>
                      <div className="text-xs text-cyan-100/70 mb-3">
                        Zoom: {Math.round(stage.scale * 100)}%
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.01"
                        value={stage.scale}
                        onChange={(e) =>
                          setStage((prevStage) => ({
                            ...prevStage,
                            scale: Number(e.target.value),
                          }))
                        }
                        className="holo-slider w-full"
                      />
                      <button
                        onClick={() => setStage({ scale: 1, x: 0, y: 0 })}
                        className="w-full py-1.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-100 rounded-md hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/30 transition-all text-xs font-semibold shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] mt-3"
                      >
                        Reset View
                      </button>
                    </div>

                    {/* --- Glow Intensity Slider --- */}
                    <div className="text-center w-full space-y-3">
                      <p className="text-sm text-cyan-100/90 font-semibold mb-2">
                        Global Glow
                      </p>
                      <div className="text-xs text-cyan-100/70 mb-3">
                        Intensity: {shadowBlur}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={shadowBlur}
                        onChange={(e) => setShadowBlur(Number(e.target.value))}
                        className="holo-slider w-full"
                      />
                    </div>
                    {/* --- END --- */}

                    <div className="border-t border-cyan-300/20 w-full" />

                    {/* Dynamic Options based on activeTool (Non-Text Tools) */}
                    {(activeTool === TOOLS.PEN ||
                      activeTool === TOOLS.RECTANGLE ||
                      activeTool === TOOLS.CIRCLE ||
                      activeTool === TOOLS.LINE) && (
                      <div className="text-center w-full space-y-4">
                        <p className="text-sm text-cyan-100/90 font-semibold">
                          {activeTool} Options
                        </p>
                        <div className="w-full flex justify-center">
                          <HexColorPicker
                            color={strokeColor}
                            onChange={(color) => {
                              setStrokeColor(color);
                              updateSelectedGenericShapeProperty(
                                "color",
                                color
                              );
                            }}
                            onPointerUp={() => handleNewState(lines)}
                            className="max-w-full"
                          />
                        </div>
                        <div
                          className="w-10 h-10 rounded-full border-2 border-cyan-400/60 mx-auto shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                          style={{ backgroundColor: strokeColor }}
                          title={strokeColor}
                        />
                        <div className="w-full">
                          <label
                            htmlFor="stroke-width"
                            className="block text-xs text-cyan-100/70 mb-3"
                          >
                            Stroke Width: {penStrokeWidth}
                          </label>
                          <input
                            id="stroke-width"
                            type="range"
                            min="1"
                            max="20"
                            value={penStrokeWidth}
                            onChange={(e) => {
                              const newWidth = Number(e.target.value);
                              setPenStrokeWidth(newWidth);
                              updateSelectedGenericShapeProperty(
                                "strokeWidth",
                                newWidth
                              );
                            }}
                            onMouseUp={() => handleNewState(lines)}
                            className="holo-slider w-full"
                          />
                        </div>
                        <div className="w-full">
                          <label
                            htmlFor="opacity"
                            className="block text-xs text-cyan-100/70 mb-3"
                          >
                            Opacity: {Math.round(penOpacity * 100)}%
                          </label>
                          <input
                            id="opacity"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={penOpacity}
                            onChange={(e) => {
                              const newOpacity = Number(e.target.value);
                              setPenOpacity(newOpacity);
                              updateSelectedGenericShapeProperty(
                                "opacity",
                                newOpacity
                              );
                            }}
                            onMouseUp={() => handleNewState(lines)}
                            className="holo-slider w-full"
                          />
                        </div>
                        {activeTool === TOOLS.RECTANGLE && (
                          <div className="w-full flex items-center justify-between px-2">
                            <label
                              htmlFor="rect-fill"
                              className="text-sm text-cyan-100/70"
                            >
                              Fill Rectangle
                            </label>
                            <input
                              id="rect-fill"
                              type="checkbox"
                              checked={isRectFilled}
                              onChange={(e) => {
                                setIsRectFilled(e.target.checked);
                              }}
                              className="holo-checkbox"
                            />
                          </div>
                        )}
                        {activeTool === TOOLS.CIRCLE && (
                          <div className="w-full flex items-center justify-between px-2">
                            <label
                              htmlFor="circle-fill"
                              className="text-sm text-cyan-100/70"
                            >
                              Fill Circle
                            </label>
                            <input
                              id="circle-fill"
                              type="checkbox"
                              checked={isCircleFilled}
                              onChange={(e) => {
                                setIsCircleFilled(e.target.checked);
                              }}
                              className="holo-checkbox"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Eraser Options */}
                    {activeTool === TOOLS.ERASER && (
                      <div className="text-center w-full space-y-3">
                        <p className="text-sm text-cyan-100/90 font-semibold mb-2">
                          Eraser Options
                        </p>
                        <div className="text-xs text-cyan-100/70 mb-3">
                          Radius: {eraserRadius}px
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          step="5"
                          value={eraserRadius}
                          onChange={(e) =>
                            setEraserRadius(Number(e.target.value))
                          }
                          className="holo-slider w-full"
                        />
                      </div>
                    )}

                    {/* Options for Text Tool */}
                    {activeTool === TOOLS.TEXT && (
                      <div className="text-center w-full space-y-3.5">
                        <p className="text-sm text-cyan-100/90 font-semibold">
                          Text Options
                        </p>
                        <div className="w-full flex justify-center">
                          <HexColorPicker
                            color={textColor}
                            onChange={(color) => {
                              setTextColor(color);
                            }}
                            onPointerUp={() => {
                              if (selectedShapeIdsRef.current.length === 1) {
                                updateSelectedTextShape("color", textColor);
                                handleNewState(lines);
                              }
                            }}
                            className="max-w-full"
                          />
                        </div>
                        <div
                          className="w-10 h-10 rounded-full border-2 border-cyan-400/60 mx-auto shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                          style={{ backgroundColor: textColor }}
                          title={textColor}
                        />
                        {/* --- FONT FAMILY PRESET SELECTOR --- */}
                        <div className="w-full">
                          <label
                            htmlFor="font-family"
                            className="block text-xs text-cyan-100/70 mb-2"
                          >
                            Font:
                          </label>
                          <select
                            id="font-family"
                            value={fontFamily}
                            onChange={(e) => {
                              handleFontFamilyChange(e.target.value);
                              handleNewState(lines);
                            }}
                            className="w-full holo-select"
                            style={{ fontFamily: fontFamily }}
                          >
                            {Object.entries(FONT_PRESETS).map(
                              ([name, family]) => (
                                <option
                                  key={name}
                                  value={family}
                                  style={{ fontFamily: family }}
                                >
                                  {name}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                        {/* --- FONT SIZE CONTROL --- */}
                        <div className="w-full">
                          <label
                            htmlFor="font-size"
                            className="block text-xs text-cyan-100/70 mb-3"
                          >
                            Size: {fontSize}px
                          </label>
                          <input
                            id="font-size"
                            type="range"
                            min="10"
                            max="100"
                            step="2"
                            value={fontSize}
                            onMouseUp={() => {
                              handleNewState(lines);
                            }}
                            onChange={(e) =>
                              handleFontSizeChange(Number(e.target.value))
                            }
                            className="holo-slider w-full"
                          />
                        </div>
                        {/* --- FONT WEIGHT SELECTOR --- */}
                        <div className="w-full">
                          <label
                            htmlFor="font-style"
                            className="block text-xs text-cyan-100/70 mb-2"
                          >
                            Font Style:{" "}
                            {
                              FONT_WEIGHTS.find((w) => w.value === fontWeight)
                                ?.label
                            }
                          </label>
                          <select
                            id="font-weight"
                            value={fontWeight}
                            onChange={(e) => {
                              handleFontWeightChange(Number(e.target.value));
                              handleNewState(lines);
                            }}
                            className="w-full holo-select"
                          >
                            {FONT_WEIGHTS.map((weight) => (
                              <option key={weight.value} value={weight.value}>
                                {weight.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* --- OPACITY CONTROL --- */}
                        <div className="w-full">
                          <label
                            htmlFor="text-opacity"
                            className="block text-xs text-cyan-100/70 mb-3"
                          >
                            Opacity: {Math.round(penOpacity * 100)}%
                          </label>
                          <input
                            id="text-opacity"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={penOpacity}
                            onMouseUp={() => {
                              handleNewState(lines);
                            }}
                            onChange={(e) =>
                              handleTextOpacityChange(Number(e.target.value))
                            }
                            className="holo-slider w-full"
                          />
                        </div>
                        {/* ----------------------------- */}

                        <p className="text-xs text-cyan-100/50 mt-2">
                          Double-click on the canvas to place new text.
                        </p>
                      </div>
                    )}

                    {activeTool === TOOLS.ERASER && (
                      <div className="text-center w-full space-y-4">
                        <p className="text-sm text-foreground/80 font-semibold">
                          Eraser Options
                        </p>
                        <button
                          onClick={handleClear}
                          className="w-full py-1.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-100 rounded-md hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/30 transition-all text-sm font-semibold shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                        >
                          Clear Board
                        </button>
                      </div>
                    )}

                    {activeTool === TOOLS.SELECT && (
                      <div className="text-center w-full">
                        <p className="text-sm text-foreground/80 font-semibold">
                          Select Options
                        </p>
                        <p className="text-xs text-foreground/60 mt-2">
                          Click a shape to select. Ctrl/Cmd+Click for
                          multi-select. Drag to marquee select. Hit Del to
                          delete selected shape.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Canvas Area  */}
          <main className="flex-1 relative bg-[linear-gradient(to_right,theme(colors.slate.800)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.800)_1px,transparent_1px)] bg-[size:96px_96px]">
            {/* Sidebar Toggle Button - Desktop only */}
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                title={
                  isSidebarVisible
                    ? "Hide Properties (Ctrl)"
                    : "Show Properties (Ctrl)"
                }
                className={`
                      absolute top-1/14 -translate-y-1/2 z-30
                      h-16 w-6 rounded-r-md 
                      flex items-center justify-center 
                      bg-cyan-950/70 hover:bg-cyan-900 
                      border border-l-0 border-cyan-300/30 
                      text-cyan-300 transition-all duration-300 shadow-xl
                      ${isSidebarVisible ? "left-56" : "left-0"}
                  `}
              >
                {isSidebarVisible ? (
                  <FaChevronLeft size={12} />
                ) : (
                  <FaChevronRight size={12} />
                )}
              </button>
            )}

            <div
              className={`w-full h-full relative ${isMobile ? "pb-20" : ""}`}
            >
              {isRoomFull && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-red-400 text-2xl font-bold z-10">
                  Room is Full!
                </div>
              )}
              <Whiteboard
                stageRef={stageRef}
                shapes={lines}
                stage={stage}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                selectedShapeIds={selectedShapeIds}
                onSelectShape={handleSelectShape}
                onTransformEnd={handleTransformEnd}
                activeTool={activeTool}
                marquee={marquee}
                onTextDblClick={handleTextDblClick}
                editTextId={editTextId}
                onStageDblClick={handleStageDblClick}
                shadowBlur={shadowBlur}
                remoteCursors={remoteCursors}
                eraserPosition={eraserPosition}
                eraserRadius={eraserRadius}
              />
            </div>
          </main>
        </div>

        {/* HUD / Toast */}
        {toast && (
          <div
            className={`fixed right-6 z-50 pointer-events-none ${
              isMobile ? "bottom-24" : "bottom-6"
            }`}
          >
            <div className="px-4 py-2 rounded-md bg-cyan-300 text-black font-semibold shadow-lg transform-gpu transition-all duration-200 ease-out translate-y-0 opacity-100">
              {toast}
            </div>
          </div>
        )}

        {/* OrbitalSelector - Desktop only */}
        {!isMobile && (
          <OrbitalSelector
            isOpen={isOrbitalSelectorOpen}
            position={orbitalSelectorPosition}
            activeTool={activeTool}
            onToolSelect={setActiveTool}
            onHoverTool={handleOrbitalHover}
            hoveredTool={hoveredTool}
          />
        )}

        {/* Mobile Toolbar */}
        {isMobile && (
          <MobileToolbar activeTool={activeTool} onToolSelect={setActiveTool} />
        )}
      </div>
    </>
  );
}
