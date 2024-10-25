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

function App() {
  const [sceneManager, setSceneManager] = useState(null);
  const [physicsWorld, setPhysicsWorld] = useState(null);
  const [meshCorners, setMeshCorners] = useState([]);
  const previewModelRef = useRef(null);
  const isDraggingRef = useRef(false);
  const draggedModuleRef = useRef(null);
  const mousePositionRef = useRef(new THREE.Vector2());
  const raycasterRef = useRef(new THREE.Raycaster());

  let cabinet;
  let hearts = [];
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

  function createTextSprite(message, parameters = {}) {
    const {
      fontface = 'Arial',
      fontsize = 70,
      color = { r: 0, g: 0, b: 255, a: 1.0 },
    } = parameters;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = fontsize + 'px ' + fontface;
    const metrics = context.measureText(message);
    const textWidth = metrics.width;
    context.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a})`;
    context.fillText(message, 0, fontsize);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(textWidth / 10, fontsize / 10, 1.0);
    return sprite;
  }

  const handleResetBox = () => {
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

        const randomColor = Math.random() * 0xffffff; // Màu ngẫu nhiên
        const material = new THREE.LineBasicMaterial({ color: 0x000000 });

        const boundingBoxEdges = new THREE.LineSegments(edges, material);

        boundingBoxEdges.position.copy(mesh.userData.positionCenter);

        // listBox.push(boundingBoxEdges);

        // Thêm khung vào scene
        display.scene.add(boundingBoxEdges);
      }
    });
  };

  // function findPoint(mesh) {
  //   hearts = [];
  //   mesh?.traverse((child) => {
  //     if (child.isMesh) {
  //       const size = setSizeGLB(child);
  //       let orientation;
  //       if (size.y < size.x && size.y < size.z) {
  //         orientation = 0; // Mesh ngang
  //       } else {
  //         if (size.x < size.y && size.x < size.z) {
  //           orientation = 2; //
  //         } else {
  //           orientation = 1; // Mesh dọc
  //         }
  //       }

  //       const box = new THREE.Box3().setFromObject(child);
  //       const min = box.min;
  //       const max = box.max;
  //       const center = new THREE.Vector3();
  //       box.getCenter(center);

  //       hearts.push({
  //         mX: {
  //           min: min.x,
  //           org: center.x, // Giá trị trung tâm theo trục X
  //           max: max.x,
  //         },
  //         mZ: {
  //           min: min.z,
  //           org: center.z, // Giá trị trung tâm theo trục Z
  //           max: max.z,
  //         },
  //         mY: {
  //           min: min.y,
  //           org: center.y, // Giá trị trung tâm theo trục Y
  //           max: max.y,
  //         },
  //         mesh: child,
  //         orientation: orientation,
  //       });
  //     }else if(child.isGroup){
  //       child?.traverse((children) => {
  //         if (children.isMesh) {
  //           const size = setSizeGLB(children);
  //           let orientation;
  //           if (size.y < size.x && size.y < size.z) {
  //             orientation = 0; // Mesh ngang
  //           } else {
  //             if (size.x < size.y && size.x < size.z) {
  //               orientation = 2; //
  //             } else {
  //               orientation = 1; // Mesh dọc
  //             }
  //           }

  //           const box = new THREE.Box3().setFromObject(children);
  //           const min = box.min;
  //           const max = box.max;
  //           const center = new THREE.Vector3();
  //           box.getCenter(center);

  //           hearts.push({
  //             mX: {
  //               min: min.x,
  //               org: center.x, // Giá trị trung tâm theo trục X
  //               max: max.x,
  //             },
  //             mZ: {
  //               min: min.z,
  //               org: center.z, // Giá trị trung tâm theo trục Z
  //               max: max.z,
  //             },
  //             mY: {
  //               min: min.y,
  //               org: center.y, // Giá trị trung tâm theo trục Y
  //               max: max.y,
  //             },
  //             mesh: children,
  //             orientation: orientation,
  //           });
  //         }
  //       });
  //     }
  //   });
  //   handleResetBox();
  // }

  function findPoint(mesh) {
    hearts = [];
    mesh?.traverse((child) => {
      if (child.isMesh) {
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

        // worldPosition.x = worldPosition.x + size1.x/2;
        // worldPosition.y = worldPosition.y + size1.y/2;
        // worldPosition.z = worldPosition.z - size1.z/2;

        child.userData.position = worldPosition;
        const point = new THREE.Vector3(
          worldPosition.x + size1.x / 2,
          worldPosition.y + size1.y / 2,
          worldPosition.z - size1.z / 2
        );
        child.userData.positionCenter = point;
        // child.position.copy(worldPosition);

        // hearts.push({
        //   mX: {
        //     min: worldPosition.x - size1.x/2,
        //     org: worldPosition.x,
        //     max: worldPosition.x + size1.x/2,
        //   },
        //   mZ: {
        //     min: worldPosition.z - size1.z/2,
        //     org: worldPosition.z,
        //     max: worldPosition.z + size1.z/2,
        //   },
        //   mY: {
        //     min: worldPosition.y - size1.y/2,
        //     org: worldPosition.y,
        //     max: worldPosition.y + size1.y/2,
        //   },
        //   mesh: child,
        //   orientation: orientation,
        // });
        hearts.push({
          mX: {
            min: min.x,
            org: center.x, // Giá trị trung tâm theo trục X
            max: max.x,
          },
          mZ: {
            min: min.z,
            org: center.z, // Giá trị trung tâm theo trục Z
            max: max.z,
          },
          mY: {
            min: min.y,
            org: center.y, // Giá trị trung tâm theo trục Y
            max: max.y,
          },
          mesh: child,
          orientation: orientation,
        });
      }
    });
    handleResetBox();
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

    // // Add a shadow for better visibility
    // context.shadowColor = 'rgba(0, 0, 0, 0.5)';
    // context.shadowOffsetX = 3;
    // context.shadowOffsetY = 3;
    // context.shadowBlur = 4;

    // Add text with border
    context.lineWidth = 1;
    // context.strokeStyle = 'white';
    // context.strokeText(text, canvas.width / 2, canvas.height / 2);
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
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
        let minDistanceD;
        let minDistanceA;
        hearts.forEach((point) => {
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

          let minDistanceE;
          let minDistanceF;
          hearts.forEach((point) => {
            if (
              intersectionPoint.z < point.mZ.max &&
              intersectionPoint.z > point.mZ.min &&
              point.orientation === 0
            ) {
              if (
                intersectionPoint.y < point.mY.org &&
                (!minDistanceE || point.mY.org < minDistanceE.mY.org)
              ) {
                minDistanceE = point;
              } else if (
                intersectionPoint.y > point.mY.org &&
                (!minDistanceF || point.mY.org > minDistanceF.mY.org)
              ) {
                minDistanceF = point;
              }
            }
          });

          const box = new THREE.Box3().setFromObject(minDistanceE.mesh);
          const size = new THREE.Vector3();
          box.getSize(size);

          const box1 = new THREE.Box3().setFromObject(previewModelRef.current);
          const size1 = new THREE.Vector3();
          box1.getSize(size1);

          const box2 = new THREE.Box3().setFromObject(minDistanceF.mesh);
          const size2 = new THREE.Vector3();
          box2.getSize(size2);

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
            display.scene.add(line);
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
            display.scene.add(textSprite);
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
            display.scene.add(line2);
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
            display.scene.add(textSprite2);
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
        let minDistanceD;
        let minDistanceA;
        hearts.forEach((point) => {
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

          let minDistanceE;
          let minDistanceF;
          hearts.forEach((point) => {
            if (
              intersectionPoint.y < point.mY.max &&
              intersectionPoint.y > point.mY.min &&
              point.orientation === 1
            ) {
              if (
                intersectionPoint.z < point.mZ.org &&
                (!minDistanceE || point.mZ.org < minDistanceE.mZ.org)
              ) {
                minDistanceE = point;
              } else if (
                intersectionPoint.z > point.mZ.org &&
                (!minDistanceF || point.mZ.org > minDistanceF.mZ.org)
              ) {
                minDistanceF = point;
              }
            }
          });

          const box = new THREE.Box3().setFromObject(minDistanceE.mesh);
          const size = new THREE.Vector3();
          box.getSize(size);

          const box1 = new THREE.Box3().setFromObject(previewModelRef.current);
          const size1 = new THREE.Vector3();
          box1.getSize(size1);

          const box2 = new THREE.Box3().setFromObject(minDistanceF.mesh);
          const size2 = new THREE.Vector3();
          box2.getSize(size2);

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
            display.scene.add(line);
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
            display.scene.add(textSprite);
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
            display.scene.add(line2);
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
            display.scene.add(textSprite2);
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

      // const randomScale = Math.random() * 3 + 1; // Tỷ lệ ngẫu nhiên từ 1 đến 4
      // previewModelRef.current.scale.set(randomScale, randomScale, randomScale);
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
        const intersectedMesh = intersects[0].object; // Mesh được click đầu tiên

        const worldPosition = new THREE.Vector3();
        intersectedMesh.getWorldPosition(worldPosition);

        // Lấy thông tin của mesh
        console.log('Mesh được click:', intersectedMesh);
        console.log('Tên của mesh:', intersectedMesh.name);
        console.log('Vị trí của mesh:', worldPosition);
        console.log(
          'Kích thước bounding box:',
          new THREE.Box3().setFromObject(intersectedMesh).getSize()
        );

        // Ví dụ: Gọi hàm findPoint với mesh được click
        findPoint(intersectedMesh);
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
      if (previewModelRef.current.userData.type === 1) {
        intersectionPoint.y = intersectionPoint.y - size.y / 2;
      } else {
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
      loadRealModel(draggedModuleRef.current, intersectionPoint);

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
        let minDistanceD;
        let minDistanceA;
        hearts.forEach((point) => {
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

        const sizeD = setSizeGLB(minDistanceD.mesh);
        const sizeA = setSizeGLB(minDistanceA.mesh);

        // model.position.copy(
        //   getPoint(minDistanceA.mesh.userData.position, minDistanceD.mesh.userData.position)
        // );

        model.position.x = Math.min(
          minDistanceD.mesh.userData.position.x,
          minDistanceA.mesh.userData.position.x
        );
        model.position.z = minDistanceA.mesh.userData.position.z - sizeA.z;
        model.position.y = intersectionPoint.y;
        // model.children[0].position.copy(model.position);
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
        let minDistanceD;
        let minDistanceA;
        hearts.forEach((point) => {
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
        model.scale.y =
          ((scaleZ - (sizeD.y / 2 + sizeA.y / 2)) * originalScale.y) /
          originalSize.y;
        cabinet.add(model);
        findPoint(cabinet);
      });
    } else if (moduleData.type == 2) {
      loader.load(moduleData.model, (gltf) => {
        const model = gltf.scene;

        let minDistanceD;
        let minDistanceA;
        hearts.forEach((point) => {
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

        let minDistanceE;
        let minDistanceF;
        hearts.forEach((point) => {
          if (
            intersectionPoint.z < point.mZ.max &&
            intersectionPoint.z > point.mZ.min &&
            point.orientation === 0
          ) {
            if (
              intersectionPoint.y < point.mY.org &&
              (!minDistanceE || point.mY.org < minDistanceE.mY.org)
            ) {
              minDistanceE = point;
            } else if (
              intersectionPoint.y > point.mY.org &&
              (!minDistanceF || point.mY.org > minDistanceF.mY.org)
            ) {
              minDistanceF = point;
            }
          }
        });

        const sizeD = setSizeGLB(minDistanceD.mesh);
        const sizeA = setSizeGLB(minDistanceA.mesh);
        const sizeE = setSizeGLB(minDistanceE.mesh);
        const sizeF = setSizeGLB(minDistanceF.mesh);
        const sizeModel = setSizeGLB(model);

        model.position.x = Math.min(
          minDistanceD.mesh.userData.position.x,
          minDistanceA.mesh.userData.position.x
        );
        model.position.z = minDistanceD.mesh.userData.position.z + sizeModel.z;
        model.position.y = minDistanceF.mesh.userData.position.y + sizeF.y;
        // model.children[0].position.copy(model.position);
        // const scaleY = Math.abs(
        //   minDistanceD.mesh.userData.position.z - minDistanceA.mesh.userData.position.z
        // );
        // const originalSize = setSizeGLB(model);
        // const originalScale = model.scale.clone();
        // model.scale.z =
        //   ((scaleY - (sizeD.z / 2 + sizeA.z / 2)) * originalScale.z) /
        //   originalSize.z;
        if (
          minDistanceA.mesh.userData.position.z - minDistanceD.mesh.userData.position.z + sizeA.z >
            sizeModel.z &&
          minDistanceE.mesh.userData.position.y - minDistanceF.mesh.userData.position.y - sizeF.y > sizeModel.y
        ) {
          cabinet.add(model);
          findPoint(cabinet);
        }
      });
    }
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
    </div>
  );
}

export default App;
