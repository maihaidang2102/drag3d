import React, { useEffect, useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import SceneInit from './lib/SceneInit';
import './App.css';
import Sidebar from './lib/Sidebar';

let display;
let planesToCheck;
let planeyz;
let cabinet;
let door;
let hearts = [];
let boundingBoxes = [];
let drawnObjects = [];
let excludedTypesDoor = [3,4];

function App() {
  const [sceneManager, setSceneManager] = useState(null);
  const [physicsWorld, setPhysicsWorld] = useState(null);
  const [meshClick, setMeshClick] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [inputValue2, setInputValue2] = useState(1);
  const [meshCorners, setMeshCorners] = useState([]);
  const previewModelRef = useRef(null);
  const isDraggingRef = useRef(false);
  const draggedModuleRef = useRef(null);
  const mousePositionRef = useRef(new THREE.Vector2());
  const raycasterRef = useRef(new THREE.Raycaster());
  const boxHelperRef = useRef(null);

  let choice = 0;
  let line, textSprite;
  let line2, textSprite2;

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 2,
  });
  let lineMesh;

  const defaultModule = {
    name: 'Default Cabinet',
    model: '/assets/TA_DEMO2.glb',
  };

  const modules = [
    {
      name: 'Xắn ngang',
      image: '/assets/anh234.png',
      model: '/assets/xanngang1.glb',
      type: 0,
    },
    {
      name: 'Xắn dọc',
      image: '/assets/anh123.png',
      model: '/assets/xandoc1.glb',
      type: 1,
    },
    {
      name: 'Xắn chữ L',
      image: '/assets/anh456.png',
      model: '/assets/XANCHUL2.glb',
      type: 2,
    },
    {
      name: 'Học tủ áo',
      image: '/assets/123123.png',
      model: '/assets/HOCTU777.glb',
      type: 3,
    },
    {
      name: 'Học chữ U',
      image: '/assets/HOCCHUU123.png',
      model: '/assets/hocchuu3.glb',
      type: 4,
    },
    {
      name: 'Xắn bo cong',
      image: '/assets/xanbocong.png',
      model: '/assets/xanbocong5.glb',
      type: 5,
    },
    {
      name: 'Cửa trơn',
      image: '/assets/cuatron.png',
      model: '/assets/CUATRON.glb',
      type: 6,
    },
  ];

  function setSizeGLB(scene) {
    const boundingBox = new THREE.Box3().setFromObject(scene, true);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    return {
      x: boundingBox.max.x - boundingBox.min.x,
      y: boundingBox.max.y - boundingBox.min.y,
      z: boundingBox.max.z - boundingBox.min.z,
    };
  }

  const handleResetBox = () => {
    console.log(hearts);
    boundingBoxes.forEach((box) => {
      display.scene.remove(box);
    });
    boundingBoxes.length = 0;

    hearts.forEach((item) => {
      const mesh = item.mesh;
      if (mesh) {
        // Tạo Box3 để xác định kích thước của mesh
        const box = new THREE.Box3().setFromObject(mesh);

        // Tính toán kích thước và vị trí của khung
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ color: 0x000000 });
        const boundingBoxEdges = new THREE.LineSegments(edges, material);

        boundingBoxEdges.position.copy(mesh.userData.positionCenter);

        boundingBoxes.push(boundingBoxEdges);

        // Thêm khung vào scene
        display.scene.add(boundingBoxEdges);
      }
    });
  };

  function findPoint(mesh) {
    hearts = [];
    mesh?.traverse((child) => {
      if (
        child.isMesh &&
        child.parent.userData.type !== 3 &&
        child.parent.userData.type !== 5
      ) {
        const size = setSizeGLB(child);
        let orientation;
        if (size.y < size.x && size.y < size.z) {
          orientation = 0; // Mesh ngang
        } else {
          if (size.x < size.y && size.x < size.z) {
            orientation = 2; //
          } else {
            orientation = 1; // Mesh dọc
          }
        }

        const worldPosition = new THREE.Vector3();
        child.getWorldPosition(worldPosition);

        const box = new THREE.Box3().setFromObject(child);
        const min = box.min;
        const max = box.max;
        const center = new THREE.Vector3();
        box.getCenter(center);

        const box1 = new THREE.Box3().setFromObject(child);
        const size1 = new THREE.Vector3();
        box1.getSize(size1);

        child.userData.position = worldPosition;
        const point = new THREE.Vector3(
          worldPosition.x + size1.x / 2,
          worldPosition.y + size1.y / 2,
          worldPosition.z - size1.z / 2
        );
        child.userData.positionCenter = point;

        hearts.push({
          mX: {
            min: min.x,
            org: center.x,
            max: max.x,
          },
          mZ: {
            min: min.z,
            org: center.z,
            max: max.z,
          },
          mY: {
            min: min.y,
            org: center.y,
            max: max.y,
          },
          mesh: child,
          orientation: orientation,
        });
      }
    });
    mesh?.traverse((child) => {
      if (
        child.isGroup &&
        (child.userData.type == 3 || child.userData.type == 5)
      ) {
        const size = setSizeGLB(child);
        let orientation;
        if (size.y < size.x && size.y < size.z) {
          orientation = 0; // Mesh ngang
        } else {
          if (size.x < size.y && size.x < size.z) {
            orientation = 2; //
          } else {
            orientation = 1; // Mesh dọc
          }
        }

        const worldPosition = new THREE.Vector3();
        child.getWorldPosition(worldPosition);

        const box = new THREE.Box3().setFromObject(child);
        const min = box.min;
        const max = box.max;
        const center = new THREE.Vector3();
        box.getCenter(center);

        const box1 = new THREE.Box3().setFromObject(child);
        const size1 = new THREE.Vector3();
        box1.getSize(size1);

        child.userData.position = worldPosition;
        const point = new THREE.Vector3(
          worldPosition.x + size1.x / 2,
          worldPosition.y + size1.y / 2,
          worldPosition.z - size1.z / 2
        );
        child.userData.positionCenter = point;

        hearts.push({
          mX: {
            min: min.x,
            org: center.x,
            max: max.x,
          },
          mZ: {
            min: min.z,
            org: center.z,
            max: max.z,
          },
          mY: {
            min: min.y,
            org: center.y,
            max: max.y,
          },
          mesh: child,
          orientation: orientation,
        });
      }
    });
    handleResetBox();
  }

  function createTextTexture(text, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const fontSize = 26;
    canvas.width = 512;
    canvas.height = 256;

    // Set a prettier font style and alignment
    context.font = `bold ${fontSize}px Arial`;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    context.lineWidth = 1;
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  useEffect(() => {
    display = new SceneInit('myThreeJsCanvas');
    display.initialize();
    display.animate();

    const world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load('assets/images (1).jpg');

    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);

    const planeM = new THREE.MeshStandardMaterial({
      map: floorTexture,
      side: THREE.DoubleSide,
      transparent: true, // Cho phép độ trong suốt
      opacity: 0,
    });

    const planeG = new THREE.PlaneGeometry(100, 100);

    const groundPlane = new THREE.Mesh(planeG, planeM);

    groundPlane.position.set(0, 0, 0);
    groundPlane.rotation.x = -Math.PI / 2;

    display.scene.add(groundPlane);
    const wallTexture = textureLoader.load(
      'assets/texture-roughcast-plaster-wall-preview.jpg'
    ); // Đường dẫn đến file ảnh của texture

    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(4, 4);
    const planeM2 = new THREE.MeshStandardMaterial({
      map: wallTexture,
      side: THREE.DoubleSide,
      transparent: true, // Cho phép độ trong suốt
      opacity: 0,
    });
    const planeG2 = new THREE.PlaneGeometry(100, 100);
    const groundPlane2 = new THREE.Mesh(planeG2, planeM2);
    groundPlane2.position.set(0, 0, 0);
    groundPlane2.rotation.y = Math.PI / 2;
    display.scene.add(groundPlane2);

    planesToCheck = [groundPlane, groundPlane2];
    planeyz = groundPlane2;

    const loader = new GLTFLoader();
    loader.load(defaultModule.model, (gltf) => {
      const model = gltf.scene;
      cabinet = gltf.scene;
      model.position.set(0, 0, 0);

      display.scene.add(model);
      findPoint(cabinet);
    });

    const cannonDebugger = new CannonDebugger(display.scene, world);

    const animate = () => {
      world.fixedStep();
      cannonDebugger.update();

      if (isDraggingRef.current && previewModelRef.current) {
        updatePreviewPosition();
      }

      display.renderer.render(display.scene, display.camera);
      window.requestAnimationFrame(animate);
    };
    animate();

    setSceneManager(display);
    setPhysicsWorld(world);

    const canvas = document.getElementById('myThreeJsCanvas');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleMouseClick);
    document.addEventListener('keydown', handleButtonDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleMouseClick);
      document.addEventListener('keydown', handleButtonDown);
    };
  }, []);

  function addObjectToScene(object) {
    display.scene.add(object);
    drawnObjects.push(object);
  }

  function clearDrawnObjects() {
    drawnObjects.forEach((object) => {
      display.scene.remove(object);
      object.geometry?.dispose();
      object.material?.dispose();
    });
    drawnObjects.length = 0;
  }

  const handleMouseMove = useCallback((event) => {
    const canvas = document.getElementById('myThreeJsCanvas');
    const rect = canvas.getBoundingClientRect();
    mousePositionRef.current.x =
      ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mousePositionRef.current.y =
      -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(
      mousePositionRef.current,
      display.camera
    );

    const intersects = raycasterRef.current.intersectObjects(
      planesToCheck,
      true
    );

    const intersectionPoint = intersects[0].point;

    if (isDraggingRef.current && previewModelRef.current) {
      if (previewModelRef.current.userData.type == 0) {
        const { minDistanceD, minDistanceA } =
          findClosestZEdges(intersectionPoint);

        if (minDistanceD && minDistanceA) {
          const sizeD = setSizeGLB(minDistanceD.mesh);
          const sizeA = setSizeGLB(minDistanceA.mesh);

          const scaleY = Math.abs(
            minDistanceD.mesh.userData.position.z -
              minDistanceA.mesh.userData.position.z
          );
          const originalSize = setSizeGLB(previewModelRef.current);
          const originalScale = previewModelRef.current.scale.clone();
          const scaleZ =
            ((scaleY - (sizeD.z / 2 + sizeA.z / 2)) * originalScale.z) /
            originalSize.z;
          previewModelRef.current.scale.set(1, 1, scaleZ);

          /// line

          const { minDistanceA: minDistanceE, minDistanceD: minDistanceF } =
            findClosestYEdges(intersectionPoint);

          const size = setSizeGLB(minDistanceE.mesh);
          const size1 = setSizeGLB(previewModelRef.current);
          const size2 = setSizeGLB(minDistanceF.mesh);

          /// giữa - trên

          const startPoint = new THREE.Vector3(
            minDistanceE.mesh.userData.position.x + size.x + 0.01,
            previewModelRef.current.position.y + size1.y,
            previewModelRef.current.position.z - size1.z / 2
          );

          const endPoint = new THREE.Vector3(
            minDistanceE.mesh.userData.position.x + size.x + 0.01,
            minDistanceE.mesh.userData.position.y,
            previewModelRef.current.position.z - size1.z / 2
          );

          // Create or update line from startPoint to endPoint along Y-axis
          if (!line) {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
              startPoint,
              endPoint,
            ]);
            line = new THREE.Line(lineGeometry, lineMaterial);
            addObjectToScene(line);
          } else {
            const points = [startPoint, endPoint];
            line.geometry.setFromPoints(points);
          }

          // Calculate distance
          const distance = startPoint.distanceTo(endPoint).toFixed(2);

          const caculatePosition =
            (
              minDistanceE.mesh.userData.position.y -
              previewModelRef.current.position.y +
              size1.y
            ).toFixed(3) * 1000;

          // Create or update text sprite
          if (!textSprite) {
            const textMaterial = new THREE.SpriteMaterial({
              map: createTextTexture(caculatePosition, 'black'),
              transparent: true,
            });
            textSprite = new THREE.Sprite(textMaterial);
            addObjectToScene(textSprite);
          } else {
            textSprite.material.map = createTextTexture(
              caculatePosition,
              'black'
            );
          }

          // Position text sprite
          textSprite.position.copy(startPoint).lerp(endPoint, 0.5);
          textSprite.position.z += 0.05;

          /// giữa - trên

          /// giữa - dưới
          const startPoint1 = new THREE.Vector3(
            minDistanceF.mesh.userData.position.x + size.x + 0.01,
            previewModelRef.current.position.y,
            previewModelRef.current.position.z - size1.z / 2
          );

          const endPoint1 = new THREE.Vector3(
            minDistanceF.mesh.userData.position.x + size.x + 0.01,
            minDistanceF.mesh.userData.position.y + size2.y,
            previewModelRef.current.position.z - size1.z / 2
          );

          if (!line2) {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
              startPoint,
              endPoint,
            ]);
            line2 = new THREE.Line(lineGeometry, lineMaterial);
            addObjectToScene(line2);
          } else {
            const points = [startPoint1, endPoint1];
            line2.geometry.setFromPoints(points);
          }

          const caculatePosition1 =
            (
              previewModelRef.current.position.y -
              minDistanceF.mesh.userData.position.y +
              size2.y
            ).toFixed(3) * 1000;

          if (!textSprite2) {
            const textMaterial = new THREE.SpriteMaterial({
              map: createTextTexture(caculatePosition1, 'black'),
              transparent: true,
            });
            textSprite2 = new THREE.Sprite(textMaterial);
            addObjectToScene(textSprite2);
          } else {
            textSprite2.material.map = createTextTexture(
              caculatePosition1,
              'black'
            );
          }

          // Position text sprite
          textSprite2.position.copy(startPoint).lerp(endPoint1, 0.5);
          textSprite2.position.z += 0.05;
          /// giữa - dưới

          /// line
        }
      } else if (previewModelRef.current.userData.type == 1) {
        const { minDistanceD, minDistanceA } =
          findClosestYEdges(intersectionPoint);

        if (minDistanceD && minDistanceA) {
          const sizeD = setSizeGLB(minDistanceD.mesh);
          const sizeA = setSizeGLB(minDistanceA.mesh);

          const scaleZ = Math.abs(
            minDistanceD.mesh.userData.position.y -
              minDistanceA.mesh.userData.position.y
          );
          const originalSize = setSizeGLB(previewModelRef.current);
          const originalScale = previewModelRef.current.scale.clone();
          const scaleY =
            ((scaleZ - (sizeD.y / 2 + sizeA.y / 2)) * originalScale.y) /
            originalSize.y;

          previewModelRef.current.scale.y = scaleY;

          /// line

          const { minDistanceA: minDistanceE, minDistanceD: minDistanceF } =
            findClosestZEdges(intersectionPoint);

          const size = setSizeGLB(minDistanceE.mesh);
          const size1 = setSizeGLB(previewModelRef.current);
          const size2 = setSizeGLB(minDistanceF.mesh);

          /// giữa - trái

          const startPoint = new THREE.Vector3(
            minDistanceE.mesh.userData.position.x + size.x + 0.01,
            previewModelRef.current.position.y + size1.y / 2,
            previewModelRef.current.position.z
          );

          const endPoint = new THREE.Vector3(
            minDistanceE.mesh.userData.position.x + size.x + 0.01,
            previewModelRef.current.position.y + size1.y / 2,
            minDistanceE.mesh.userData.position.z - size.z
          );

          // Create or update line from startPoint to endPoint along Y-axis
          if (!line) {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
              startPoint,
              endPoint,
            ]);
            line = new THREE.Line(lineGeometry, lineMaterial);
            addObjectToScene(line);
          } else {
            const points = [startPoint, endPoint];
            line.geometry.setFromPoints(points);
          }

          // Calculate distance
          const distance = startPoint.distanceTo(endPoint).toFixed(2);

          const caculatePosition =
            (
              minDistanceE.mesh.userData.position.z -
              previewModelRef.current.position.z +
              size.z
            ).toFixed(3) * 1000;

          // Create or update text sprite
          if (!textSprite) {
            const textMaterial = new THREE.SpriteMaterial({
              map: createTextTexture(caculatePosition, 'black'),
              transparent: true,
            });
            textSprite = new THREE.Sprite(textMaterial);
            addObjectToScene(textSprite);
          } else {
            textSprite.material.map = createTextTexture(
              caculatePosition,
              'black'
            );
          }

          // Position text sprite
          textSprite.position.copy(startPoint).lerp(endPoint, 0.5);
          textSprite.position.y += 0.05;

          /// giữa - trên

          /// giữa - dưới
          const startPoint1 = new THREE.Vector3(
            minDistanceF.mesh.userData.position.x + size.x + 0.01,
            previewModelRef.current.position.y + size1.y / 2,
            previewModelRef.current.position.z - size1.z
          );

          const endPoint1 = new THREE.Vector3(
            minDistanceF.mesh.userData.position.x + size.x + 0.01,
            previewModelRef.current.position.y + size1.y / 2,
            minDistanceF.mesh.userData.position.z
          );

          if (!line2) {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
              startPoint,
              endPoint,
            ]);
            line2 = new THREE.Line(lineGeometry, lineMaterial);
            addObjectToScene(line2);
          } else {
            const points = [startPoint1, endPoint1];
            line2.geometry.setFromPoints(points);
          }

          const caculatePosition1 =
            (
              previewModelRef.current.position.z -
              minDistanceF.mesh.userData.position.z +
              size2.z
            ).toFixed(3) * 1000;

          if (!textSprite2) {
            const textMaterial = new THREE.SpriteMaterial({
              map: createTextTexture(caculatePosition1, 'black'),
              transparent: true,
            });
            textSprite2 = new THREE.Sprite(textMaterial);
            addObjectToScene(textSprite2);
          } else {
            textSprite2.material.map = createTextTexture(
              caculatePosition1,
              'black'
            );
          }

          // Position text sprite
          textSprite2.position.copy(startPoint).lerp(endPoint1, 0.5);
          textSprite2.position.y += 0.05;
          /// giữa - dưới

          /// line
        }
      } else if (previewModelRef.current.userData.type == 2) {
        console.log('123');
      }
    }
  }, []);

  const handleButtonDown = useCallback(
    (event) => {
      if (event.key == 0) {
        choice = 0;
      }
      if (event.key == 1) {
        choice = 1;
      }
    },
    [display]
  );

  const handleMouseClick = useCallback(
    (event) => {
      const canvas = document.getElementById('myThreeJsCanvas');
      const rect = canvas.getBoundingClientRect();

      // Chuyển đổi tọa độ của con chuột sang tọa độ normalized device coordinates (NDC)
      mousePositionRef.current.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mousePositionRef.current.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Đặt raycaster từ vị trí camera và tọa độ của con chuột
      raycasterRef.current.setFromCamera(
        mousePositionRef.current,
        display.camera
      );

      // Tìm các đối tượng bị giao cắt
      const intersects = raycasterRef.current.intersectObjects(
        cabinet.children,
        true
      );

      if (intersects.length > 0) {
        let meshClicked = null;
        clearDrawnObjects();

        const intersectedMesh = intersects[0].object; // Mesh được click đầu tiên

        if (boxHelperRef.current) {
          display.scene.remove(boxHelperRef.current); // Xóa box cũ khỏi cảnh
          boxHelperRef.current = null; // Đặt lại ref
        }

        const worldPosition = new THREE.Vector3();
        intersectedMesh.getWorldPosition(worldPosition);

        console.log('Mesh được click:', intersectedMesh);

        if (
          intersectedMesh.userData.type == 5 ||
          intersectedMesh.userData.type == 3
        ) {
          console.log(cabinet);
          cabinet.children.forEach((item) => {
            if (item.uuid === intersectedMesh.userData.parentGltf) {
              setMeshClick(item);
              meshClicked = item;
              const sizeMesh = setSizeGLB(item);
              console.log(item);
              console.log(sizeMesh);
              setInputValue(sizeMesh.y.toFixed(3) * 1000);
            }
          });
        } else {
          meshClicked = intersectedMesh;
          setMeshClick(intersectedMesh);
        }

        if (meshClicked.userData.type !== undefined) {
          const boundingBox = new THREE.Box3().setFromObject(meshClicked);
          const center = new THREE.Vector3();
          boundingBox.getCenter(center);

          const { minDistanceD, minDistanceA } = findClosestZEdges(center);
          const { minDistanceA: minDistanceE, minDistanceD: minDistanceF } =
            findClosestYEdges(center);

          const sizeD = setSizeGLB(minDistanceD.mesh);
          const sizeA = setSizeGLB(minDistanceA.mesh);
          const sizeE = setSizeGLB(minDistanceE.mesh);
          const sizeF = setSizeGLB(minDistanceF.mesh);

         

          const offsetX = Math.max(
            minDistanceD.mesh.userData.position.x + sizeD.x,
            minDistanceA.mesh.userData.position.x + sizeA.x,
            minDistanceE.mesh.userData.position.x + sizeE.x,
            minDistanceF.mesh.userData.position.x + sizeF.x
          );

          const offsetZ = minDistanceA.mesh.userData.position.z+((minDistanceD.mesh.userData.position.z - minDistanceA.mesh.userData.position.z - sizeA.z)/2);
          const offsetY = minDistanceF.mesh.userData.position.y +(( minDistanceE.mesh.userData.position.y - minDistanceF.mesh.userData.position.y + sizeF.y)/2);

          const width = offsetX + 0.02;
          const height = minDistanceE.mesh.userData.position.y - minDistanceF.mesh.userData.position.y - sizeF.y; 
          const depth = minDistanceA.mesh.userData.position.z - minDistanceD.mesh.userData.position.z - sizeA.z;

          const geometry = new THREE.BoxGeometry(width, height, depth); 
          const material = new THREE.MeshStandardMaterial({
            color: 0x00BFFF, // Màu sắc
            metalness: 0.5, // Chất liệu kim loại
            roughness: 0.5, // Độ nhám
            transparent: true,  
            opacity : 0.5
          });

          // Tạo Mesh từ geometry và material
          const box = new THREE.Mesh(geometry, material);

          // Đặt vị trí cho khối hộp
          box.position.set(offsetX/2, offsetY, offsetZ);
          display.scene.add(box);
          boxHelperRef.current = box;
        }
      }
    },
    [display]
  );

  const updatePreviewPosition = () => {
    raycasterRef.current.setFromCamera(
      mousePositionRef.current,
      display.camera
    );

    const intersects = raycasterRef.current.intersectObjects(
      planesToCheck,
      true
    );

    if (intersects.length > 0) {
      const intersectionPoint = intersects[0].point;

      const box = new THREE.Box3().setFromObject(previewModelRef.current);

      const size = new THREE.Vector3();
      box.getSize(size);
      if (previewModelRef.current.userData.type === 0) {
        intersectionPoint.z = intersectionPoint.z + size.z / 2;
      }else{
        intersectionPoint.y = intersectionPoint.y - size.y / 2;
        intersectionPoint.z = intersectionPoint.z + size.z / 2;
      }

      previewModelRef.current.position.copy(intersectionPoint);
    }
  };

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current && previewModelRef.current) {
      isDraggingRef.current = false;

      raycasterRef.current.setFromCamera(
        mousePositionRef.current,
        display.camera
      );

      const intersects = raycasterRef.current.intersectObjects(
        planesToCheck,
        true
      );

      const intersectionPoint = intersects[0].point;

      display.scene.remove(previewModelRef.current);
      if (draggedModuleRef.current.type === 6) {
        loadRealModelDoor(draggedModuleRef.current, intersectionPoint);
      } else {
        loadRealModel(draggedModuleRef.current, intersectionPoint);
      }

      previewModelRef.current = null;
      draggedModuleRef.current = null;
    }
  }, [display]);

  const handleDragStart = (e, module) => {
    e.preventDefault();
    isDraggingRef.current = true;
    draggedModuleRef.current = module;

    const loader = new GLTFLoader();
    loader.load(module.model, (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.8; // Set opacity for the preview
        }
      });
      model.userData.type = module.type;
      previewModelRef.current = model;
      display.scene.add(model);
      updatePreviewPosition(); // Position the preview immediately
    });
  };

  const findClosestZEdges = (intersectionPoint , excludedTypes ) => {
    let minDistanceD;
    let minDistanceA;

    hearts.forEach((point) => {
      if (excludedTypes && excludedTypes.includes(point.mesh.userData?.type)) {
        return;
      }
      if (
        intersectionPoint.y < point.mY.max &&
        intersectionPoint.y > point.mY.min &&
        point.orientation === 1
      ) {
        if (
          intersectionPoint.z < point.mZ.org &&
          (!minDistanceA || point.mZ.org < minDistanceA.mZ.org)
        ) {
          minDistanceA = point;
        } else if (
          intersectionPoint.z > point.mZ.org &&
          (!minDistanceD || point.mZ.org > minDistanceD.mZ.org)
        ) {
          minDistanceD = point;
        }
      }
    });

    return { minDistanceD, minDistanceA };
  };

  const findClosestYEdges = (intersectionPoint , excludedTypes ) => {
    let minDistanceD;
    let minDistanceA;

    hearts.forEach((point) => {
      if (excludedTypes && excludedTypes.includes(point.mesh.userData?.type)) {
        return;
      }
      if (
        intersectionPoint.z < point.mZ.max &&
        intersectionPoint.z > point.mZ.min &&
        point.orientation === 0
      ) {
        if (
          intersectionPoint.y < point.mY.org &&
          (!minDistanceA || point.mY.org < minDistanceA.mY.org)
        ) {
          minDistanceA = point;
        } else if (
          intersectionPoint.y > point.mY.org &&
          (!minDistanceD || point.mY.org > minDistanceD.mY.org)
        ) {
          minDistanceD = point;
        }
      }
    });

    return { minDistanceD, minDistanceA };
  };

  const loadRealModelDoor = (moduleData, intersectionPoint) => {
    const loader = new GLTFLoader();
    if (moduleData.type == 6) {
      loader.load(moduleData.model, (gltf) => {
        let model;
        gltf.scene?.traverse((child) => {
          if (child.isMesh) {
            model = child;
          }
        });
        const { minDistanceD, minDistanceA } =
          findClosestZEdges(intersectionPoint , excludedTypesDoor);
        const { minDistanceA: minDistanceE, minDistanceD: minDistanceF } =
          findClosestYEdges(intersectionPoint,excludedTypesDoor);

        const sizeD = setSizeGLB(minDistanceD.mesh);
        const sizeA = setSizeGLB(minDistanceA.mesh);
        const sizeE = setSizeGLB(minDistanceE.mesh);
        const sizeF = setSizeGLB(minDistanceF.mesh);

        model.position.x = Math.max(
          minDistanceD.mesh.userData.position.x + sizeD.x,
          minDistanceA.mesh.userData.position.x + sizeA.x,
          minDistanceE.mesh.userData.position.x + sizeE.x,
          minDistanceF.mesh.userData.position.x + sizeF.x
        );
        model.position.z = Math.max(
          minDistanceD.mesh.userData.position.z,
          minDistanceA.mesh.userData.position.z
        );
        model.position.y = Math.min(
          minDistanceE.mesh.userData.position.y,
          minDistanceF.mesh.userData.position.y
        );

        const originalSize = setSizeGLB(model);
        const originalScale = model.scale.clone();
        const sizeY =
          minDistanceE.mesh.position.y - minDistanceF.mesh.position.y + sizeE.y;
        const sizeZ =
          minDistanceA.mesh.position.z - minDistanceD.mesh.position.z + sizeD.z;
        const scaleY = sizeY / originalSize.y;
        const scaleZ = sizeZ / originalSize.z;
        model.scale.y = scaleY;
        model.scale.z = scaleZ;
        display.scene.add(model);
        // findPoint(cabinet);
      });
    }
  };

  // #region CODE CUA DANG
  const checkVariantExists = (meshStructure, S, X) => {
    const parts = meshStructure.split('_');

    const sPart = parts.find((part) => part.startsWith(`${S}-`));
    if (!sPart) {
      return false;
    }

    const variants = sPart.split('-')[1];
    return variants && variants.includes(X);
  };

  const adjustScaleByVertical = (gltfScene, mesh) => {
    const size = setSizeGLB(mesh);
    const minZ = mesh.position.z - size.z;
    const maxZ = mesh.position.z;

    let count = 0;
    let measure = 0;
    gltfScene?.traverse((child) => {
      if (child.isMesh) {
        const sizeChild = setSizeGLB(child);
        let orientation;
        if (sizeChild.y < sizeChild.x && sizeChild.y < sizeChild.z) {
          orientation = 0; // Mesh ngang
        } else {
          if (sizeChild.x < sizeChild.y && sizeChild.x < sizeChild.z) {
            orientation = 2; // mesh giống tấm hậu
          } else {
            orientation = 1; // Mesh dọc
          }
        }
        if (
          orientation === 1 &&
          (child.position.z < minZ || child.position.z > maxZ)
        ) {
          count++;
          measure += sizeChild.z;
        }
      }
    });

    return { count, measure };
  };

  const scaleCabinetShelf = (gltfScene, sizeDefault, sizeScale, numMesh) => {
    gltfScene?.traverse((child) => {
      if (child.isMesh) {
        if (checkVariantExists(child.name, 'S', 'Z')) {
          const result = adjustScaleByVertical(gltfScene, child);
          const scaleZ =
            (sizeScale - result.measure) / (sizeDefault.z - result.measure);
          child.scale.z = scaleZ;
        }
      }
    });
    gltfScene?.traverse((child) => {
      if (child.isMesh) {
        if (checkVariantExists(child.name, 'P', 'Z')) {
          let scaleZ;
          if (sizeDefault.z > sizeScale) {
            const temp = sizeScale / sizeDefault.z;
            if (checkVariantExists(child.name, 'S', 'Y')) {
              scaleZ = temp + (temp * 0.031 - 0.031);
            } else {
              scaleZ = temp + (temp * 0.014 - 0.014);
            }
          } else {
            const temp = sizeScale / sizeDefault.z;
            if (checkVariantExists(child.name, 'S', 'Y')) {
              scaleZ = temp - (temp * 0.031 - 0.031);
            } else {
              scaleZ = temp - (temp * 0.014 - 0.014);
            }
          }
          child.position.z = child.position.z * scaleZ;
        }
      }
    });
  };
  const scaleCabinetShelfU = (gltfScene, sizeDefault, sizeScale, numMesh) => {
    gltfScene?.traverse((child) => {
      if (child.isMesh) {
        if (checkVariantExists(child.name, 'S', 'Z')) {
          const scaleZ = sizeScale / sizeDefault.z;
          child.scale.z = scaleZ;
        }
      }
    });
    gltfScene?.traverse((child) => {
      if (child.isMesh) {
        if (checkVariantExists(child.name, 'P', 'Z')) {
          let scaleZ;
          if (sizeDefault.z > sizeScale) {
            const temp = sizeScale / sizeDefault.z;
            if (checkVariantExists(child.name, 'S', 'X')) {
              scaleZ = temp + (temp * 0.065 - 0.065);
            } else {
              scaleZ = temp + (temp * 0.048 - 0.048);
            }
          } else {
            const temp = sizeScale / sizeDefault.z;
            if (checkVariantExists(child.name, 'S', 'X')) {
              scaleZ = temp - (temp * 0.065 - 0.065);
            } else {
              scaleZ = temp - (temp * 0.048 - 0.048);
            }
          }
          child.position.z = child.position.z * scaleZ;
        }
      }
    });
  };

  const setInfoModel = (gltfScene) => {
    let count = 0;
    gltfScene?.traverse((child) => {
      if (child.isMesh) {
        const size = setSizeGLB(child);
        let orientation;
        if (size.y < size.x && size.y < size.z) {
          orientation = 0; // Mesh ngang
        } else {
          if (size.x < size.y && size.x < size.z) {
            orientation = 2; // mesh giống tấm hậu
          } else {
            orientation = 1; // Mesh dọc
            count++;
          }
        }
        child.userData.orientation = orientation;
      }
    });
    return count;
  };

  const setInfoModelChild = (gltfScene) => {
    gltfScene?.traverse((child) => {
      if (child.isMesh) {
        child.userData.type = gltfScene.userData.type;
        child.userData.parentGltf = gltfScene.uuid;
        const size = setSizeGLB(child);
        child.userData.sizeDefault = size;
      }
    });
    const size = setSizeGLB(gltfScene);
    gltfScene.userData.sizeDefault = size;
  };

  const loadRealModel = (moduleData, intersectionPoint) => {
    const loader = new GLTFLoader();
    if (moduleData.type == 0) {
      loader.load(moduleData.model, (gltf) => {
        let model;
        gltf.scene?.traverse((child) => {
          if (child.isMesh) {
            model = child;
          }
        });
        const { minDistanceD, minDistanceA } =
          findClosestZEdges(intersectionPoint);

        const sizeD = setSizeGLB(minDistanceD.mesh);
        const sizeA = setSizeGLB(minDistanceA.mesh);
        model.position.x = Math.min(
          minDistanceD.mesh.userData.position.x,
          minDistanceA.mesh.userData.position.x
        );
        model.position.z = minDistanceA.mesh.userData.position.z - sizeA.z;
        model.position.y = intersectionPoint.y;
        const scaleY = Math.abs(
          minDistanceD.mesh.userData.position.z -
            minDistanceA.mesh.userData.position.z
        );
        const originalSize = setSizeGLB(model);
        const originalScale = model.scale.clone();
        model.scale.z =
          ((scaleY - (sizeD.z / 2 + sizeA.z / 2)) * originalScale.z) /
          originalSize.z;
        cabinet.add(model);
        model.userData.type = moduleData.type;
        setInfoModelChild(model);
        findPoint(cabinet);
      });
    } else if (moduleData.type == 1) {
      loader.load(moduleData.model, (gltf) => {
        let model;
        gltf.scene?.traverse((child) => {
          if (child.isMesh) {
            model = child;
          }
        });

        const { minDistanceD, minDistanceA } =
          findClosestYEdges(intersectionPoint);

        const sizeD = setSizeGLB(minDistanceD.mesh);
        const sizeA = setSizeGLB(minDistanceA.mesh);
        model.position.x = Math.min(
          minDistanceD.mesh.userData.position.x,
          minDistanceA.mesh.userData.position.x
        );
        model.position.y = minDistanceD.mesh.userData.position.y + sizeD.y;
        model.position.z = intersectionPoint.z;
        const scaleZ = Math.abs(
          minDistanceD.mesh.userData.position.y -
            minDistanceA.mesh.userData.position.y
        );
        const originalSize = setSizeGLB(model);
        const originalScale = model.scale.clone();
        model.scale.y = ((scaleZ - sizeD.y) * originalScale.y) / originalSize.y;
        cabinet.add(model);
        model.userData.type = moduleData.type;
        setInfoModelChild(model);
        findPoint(cabinet);
      });
    } else if (moduleData.type == 2) {
      loader.load(moduleData.model, (gltf) => {
        const model = gltf.scene;

        const { minDistanceD, minDistanceA } =
          findClosestZEdges(intersectionPoint);
        const { minDistanceA: minDistanceE, minDistanceD: minDistanceF } =
          findClosestYEdges(intersectionPoint);

        const sizeA = setSizeGLB(minDistanceA.mesh);
        const sizeF = setSizeGLB(minDistanceF.mesh);
        const sizeModel = setSizeGLB(model);

        model.position.x = Math.min(
          minDistanceD.mesh.userData.position.x,
          minDistanceA.mesh.userData.position.x
        );
        model.position.z = minDistanceD.mesh.userData.position.z + sizeModel.z;
        model.position.y = minDistanceF.mesh.userData.position.y + sizeF.y;
        if (
          minDistanceA.mesh.userData.position.z -
            minDistanceD.mesh.userData.position.z +
            sizeA.z >
            sizeModel.z &&
          minDistanceE.mesh.userData.position.y -
            minDistanceF.mesh.userData.position.y -
            sizeF.y >
            sizeModel.y
        ) {
          cabinet.add(model);
          findPoint(cabinet);
        }
      });
    } else if (moduleData.type == 3) {
      loader.load(moduleData.model, (gltf) => {
        let model = gltf.scene;

        const { minDistanceD, minDistanceA } =
          findClosestZEdges(intersectionPoint);
        const sizeA = setSizeGLB(minDistanceA.mesh);
        model.position.x = Math.min(
          minDistanceD.mesh.userData.position.x,
          minDistanceA.mesh.userData.position.x
        );
        model.position.z = minDistanceA.mesh.userData.position.z - sizeA.z;
        model.position.y = intersectionPoint.y;
        const sizeZ =
          minDistanceA.mesh.position.z - minDistanceD.mesh.position.z - sizeA.z;

        const originalSize = setSizeGLB(model);

        const count = setInfoModel(model);
        scaleCabinetShelf(model, originalSize, sizeZ, count);
        model.userData.type = moduleData.type;
        setInfoModelChild(model);
        cabinet.add(model);
        findPoint(cabinet);
      });
    } else if (moduleData.type == 4) {
      loader.load(moduleData.model, (gltf) => {
        let model = gltf.scene;
        const { minDistanceD, minDistanceA } =
          findClosestZEdges(intersectionPoint);

        const { minDistanceA: minDistanceE, minDistanceD: minDistanceF } =
          findClosestYEdges(intersectionPoint);

        const sizeA = setSizeGLB(minDistanceA.mesh);
        const sizeF = setSizeGLB(minDistanceF.mesh);

        model.position.x = Math.min(
          minDistanceD.mesh.userData.position.x,
          minDistanceA.mesh.userData.position.x
        );
        model.position.z = minDistanceA.mesh.userData.position.z - sizeA.z;
        model.position.y = minDistanceF.mesh.userData.position.y + sizeF.y;

        const sizeZ =
          minDistanceA.mesh.position.z - minDistanceD.mesh.position.z - sizeA.z;

        const originalSize = setSizeGLB(model);

        const count = setInfoModel(model);
        scaleCabinetShelfU(model, originalSize, sizeZ, count);
        model.userData.type = moduleData.type;
        setInfoModelChild(model);
        cabinet.add(model);
        findPoint(cabinet);
      });
    } else if (moduleData.type == 5) {
      loader.load(moduleData.model, (gltf) => {
        let model = gltf.scene;
        const { minDistanceD, minDistanceA } =
          findClosestYEdges(intersectionPoint);

        const sizeD = setSizeGLB(minDistanceD.mesh);
        model.position.x = Math.min(
          minDistanceD.mesh.userData.position.x,
          minDistanceA.mesh.userData.position.x
        );
        model.position.y = minDistanceD.mesh.userData.position.y + sizeD.y;
        model.position.z = intersectionPoint.z;
        model.userData.type = moduleData.type;
        setInfoModelChild(model);
        cabinet.add(model);
        findPoint(cabinet);
      });
    }
  };
  // #endregion

  const handleDone = () => {
    console.log(cabinet);
    const sizeChange = inputValue / 1000;
    const sizeParent = setSizeGLB(meshClick);
    meshClick?.traverse((child) => {
      if (child.isMesh) {
        if (
          !checkVariantExists(child.name, 'P', 'X') &&
          !checkVariantExists(child.name, 'P', 'Y')
        ) {
          const size = setSizeGLB(child);
          const delta = sizeParent.y - size.y;
          const scale = (sizeChange - delta) / child.userData.sizeDefault.y;
          child.scale.y = scale;
        } else {
          const delta = sizeChange - sizeParent.y;
          child.position.y += delta;
        }
      }
    });
    const sizeParentAfter = setSizeGLB(meshClick);
    console.log(sizeParentAfter);
    findPoint(cabinet);
  };

  const handleDuplicate = () => {
    if (
      (meshClick.userData.type === 0 || meshClick.userData.type === 3) &&
      inputValue2 !== 1
    ) {
      const boundingBox = new THREE.Box3().setFromObject(meshClick);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      const { minDistanceD, minDistanceA } = findClosestYEdges(center);

      const sizeD = setSizeGLB(minDistanceD.mesh);
      const sizeMesh = setSizeGLB(meshClick);
      const spaceY =
        minDistanceA.mesh.position.y - minDistanceD.mesh.position.y + sizeD.y;
      const numMeshs = Number(inputValue2);
      const offsetY = (spaceY - sizeMesh.y * inputValue2) / (numMeshs + 1);
      for (let i = 0; i < inputValue2; i++) {
        if (i === 0) {
          meshClick.position.y =
            minDistanceD.mesh.position.y + sizeD.y + offsetY;
        } else {
          const clone = meshClick.clone();
          const positionY =
            minDistanceD.mesh.position.y +
            sizeD.y +
            offsetY * (i + 1) +
            sizeMesh.y * i;
          clone.position.y = positionY;
          cabinet.add(clone);
        }
      }
    } else if (meshClick.userData.type === 1 && inputValue2 !== 1) {
      const boundingBox = new THREE.Box3().setFromObject(meshClick);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      const { minDistanceD, minDistanceA } = findClosestZEdges(center);

      const sizeA = setSizeGLB(minDistanceA.mesh);
      const sizeMesh = setSizeGLB(meshClick);
      const spaceZ =
        minDistanceA.mesh.position.z - minDistanceD.mesh.position.z + sizeA.z;
      const numMeshs = Number(inputValue2);
      const offsetZ = (spaceZ - sizeMesh.z * inputValue2) / (numMeshs + 1);
      for (let i = 0; i < inputValue2; i++) {
        if (i === 0) {
          meshClick.position.z =
            minDistanceA.mesh.position.z - sizeA.z - offsetZ;
        } else {
          const clone = meshClick.clone();
          const positionZ =
            minDistanceA.mesh.position.z -
            sizeA.z -
            offsetZ * (i + 1) -
            sizeMesh.z * i;
          clone.position.z = positionZ;
          cabinet.add(clone);
        }
      }
    }
    findPoint(cabinet);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', position: 'absolute' }}>
      <Sidebar modules={modules} onDragStart={handleDragStart} />
      <div className="canvas-container" onDragOver={handleDragOver}>
        <canvas id="myThreeJsCanvas" />
      </div>
      <div style={{ alignItems: 'center', marginLeft: '10px' }}>
        <input
          type="number"
          placeholder="Nhập kích thước"
          value={inputValue}
          style={{
            marginRight: '5px',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px',
            width: '150px',
          }}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button
          onClick={handleDone}
          style={{
            padding: '8px 12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#45a049')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#4CAF50')}
        >
          Đổi kích thước xắn bo cong
        </button>
      </div>
      <div style={{ alignItems: 'center', marginLeft: '80px' }}>
        <input
          type="number"
          placeholder="Nhập kích thước"
          value={inputValue2}
          style={{
            marginRight: '5px',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px',
            width: '150px',
          }}
          onChange={(e) => setInputValue2(e.target.value)}
        />
        <button
          onClick={handleDuplicate}
          style={{
            padding: '8px 12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#45a049')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#4CAF50')}
        >
          Nhân bản
        </button>
      </div>
    </div>
  );
}

export default App;
