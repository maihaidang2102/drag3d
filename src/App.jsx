import React, { useEffect, useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import SceneInit from './lib/SceneInit';
import './App.css';
import Sidebar from './lib/Sidebar';

let display;

function App() {
  const [sceneManager, setSceneManager] = useState(null);
  const [physicsWorld, setPhysicsWorld] = useState(null);
  const [meshCorners, setMeshCorners] = useState([]);
  const previewModelRef = useRef(null);
  const isDraggingRef = useRef(false);
  const draggedModuleRef = useRef(null);
  const mousePositionRef = useRef(new THREE.Vector2());
  const raycasterRef = useRef(new THREE.Raycaster());

  let cabinet
  let hearts = []
  let choice = 0

  const defaultModule = {
    name: 'Default Cabinet',
    model: '/assets/TA_DEMO.glb', // Path to the default module from local storage
  };
  const defaultModule2 = {
    name: 'Default Cabinet',
    model: '/assets/xanngang.glb', // Path to the default module from local storage
  };
  const defaultModule1 = {
    name: 'Default Cabinet',
    model: '/assets/xandoc.glb', // Path to the default module from local storage
  };

  const modules = [
    {
      name: 'Xắn ngang',
      image: '/assets/anh234.png',
      model: '/assets/xanngang.glb',
    },
    {
      name: 'Xắn dọc',
      image: '/assets/anh123.png',
      model: '/assets/xandoc.glb',
    },
    // Add more modules here
  ];

  const getMeshCorners = (mesh, type) => {
    // Tạo bounding box cho mesh
    const box = new THREE.Box3().setFromObject(mesh);

    // Lấy các giá trị min và max của bounding box
    const min = box.min; // Góc dưới cùng bên trái (thấp nhất)
    const max = box.max; // Góc trên cùng bên phải (cao nhất)

    let corners;
    if (type === 1) {
      corners = [
        new THREE.Vector3(min.x, min.y, min.z), // Bottom-left-front
        new THREE.Vector3(max.x, min.y, min.z), // Bottom-right-front
        new THREE.Vector3(max.x, max.y, max.z), // Top-left-back
        new THREE.Vector3(max.x, max.y, max.z), // Top-right-back
      ];
    } else {
      corners = [
        new THREE.Vector3(min.x, min.y, min.z), // Bottom-left-front
        new THREE.Vector3(max.x, min.y, min.z), // Bottom-right-front
        new THREE.Vector3(min.x, min.y, max.z), // Top-left-back
        new THREE.Vector3(max.x, min.y, max.z), // Top-right-back
      ];
    }
    // Tính các góc còn lại dựa trên min và max


    return corners;
  };

  // Hàm để lấy vị trí các góc của tất cả các mesh trong module
  const saveMeshCorners = (scene) => {
    const meshCornerData = [];

    scene.traverse((child) => {
      if (child.isMesh && child.name === 'BIA-TRAI') {
        // Lấy 4 góc của mesh
        const worldMatrix = child.matrixWorld.clone();

        // Lấy hướng của trục Y của mesh trong không gian thế giới
        const meshUpDirection = new THREE.Vector3(0, 1, 0)
          .applyMatrix4(worldMatrix)
          .normalize();

        // Kiểm tra xem mesh nằm ngang hay dọc
        let orientation = 1;
        if (Math.abs(meshUpDirection.y) < 0.1) {
          orientation = 2;
        }
        const corners = getMeshCorners(child, orientation);
        child.visible = true;

        // Lưu lại tên và vị trí các góc của từng mesh
        meshCornerData.push({
          name: child.name,
          corners: corners,
          orientation: orientation,
        });
      } else if (child.name === "HAU") {
        // child.visible = false;
      }
    });

    console.log(meshCornerData); // Xem dữ liệu các góc
    return meshCornerData; // Trả về danh sách chứa thông tin các mesh và góc của chúng
  };

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

  function findPoint(mesh) {
    hearts = []
    mesh?.traverse((child) => {
      if (child.name.includes("CHECK")) {
        const size = setSizeGLB(child)
        hearts.push({
          mX: {
            min: child.position.x - size.x / 2,
            org: child.position.x,
            max: child.position.x + size.x / 2,
          },
          mZ: {
            min: child.position.z - size.z / 2,
            org: child.position.z,
            max: child.position.z + size.z / 2,
          },
          mY: {
            min: child.position.y - size.y / 2,
            org: child.position.y,
            max: child.position.y + size.y / 2,
          },
          mesh: child
        })
      }
    })
  }

  useEffect(() => {
    display = new SceneInit('myThreeJsCanvas');
    display.initialize();
    display.animate();

    const world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });

    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // loadDefaultModule(defaultModule);

    const loader = new GLTFLoader();
    loader.load(defaultModule.model, (gltf) => {
      const model = gltf.scene;
      cabinet = gltf.scene
      model.position.set(0, 0, 0); // Place the default module at the

      const corners = saveMeshCorners(model);
      setMeshCorners(corners);
      createCornerMarkers(corners, display.scene);

      display.scene.add(model);
      findPoint(cabinet)
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

  useEffect(() => {
    console.log(display === null);
  }, [display]);

  const createCornerMarkers = (meshCorners, scene) => {
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00]; // Mảng màu

    meshCorners.forEach((meshData, index) => {
      meshData.corners.forEach((corner, i) => {
        const geometry = new THREE.SphereGeometry(0.01, 16, 16); // Tạo hình cầu nhỏ
        const material = new THREE.MeshBasicMaterial({
          color: colors[i % colors.length],
        }); // Đặt màu
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(corner); // Đặt vị trí tại các điểm góc
        scene.add(sphere); // Thêm hình cầu vào scene
      });
    });
  };

  const handleMouseMove = useCallback((event) => {
    const canvas = document.getElementById('myThreeJsCanvas');
    const rect = canvas.getBoundingClientRect();
    mousePositionRef.current.x =
      ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mousePositionRef.current.y =
      -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }, []);

  const handleButtonDown = useCallback((event) => {
    if (event.key == 0) {
      choice = 0
    }
    if (event.key == 1) {
      choice = 1
    }
  }, [display])

  const handleMouseClick = useCallback((event) => {
    // chien check
    const canvas = document.getElementById('myThreeJsCanvas');
    const rect = canvas.getBoundingClientRect();
    mousePositionRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mousePositionRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(mousePositionRef.current, display.camera);
    const intersects = raycasterRef.current.intersectObjects(display.scene.children, true);

    function getMidpoint(v1, v2) {
      return new THREE.Vector3(
        (v1.x + v2.x) / 2,
        (v1.y + v2.y) / 2,
        (v1.z + v2.z) / 2
      );
    }
    if (intersects.length > 0) {
      const intersection = intersects[0];
      const intersectionPoint = intersection.point;
      const loader = new GLTFLoader();
      if (choice == 0) {
        loader.load(defaultModule2.model, (gltf) => {
          const model = gltf.scene.children[0];

          let minDistanceD
          let minDistanceA
          hearts.forEach(point => {
            if (intersectionPoint.y < point.mY.max && intersectionPoint.y > point.mY.min) {
              if (intersectionPoint.z < point.mZ.org && (!minDistanceA || point.mZ.org < minDistanceA.mZ.org)) {
                minDistanceA = point
              } else if (intersectionPoint.z > point.mZ.org && (!minDistanceD || point.mZ.org > minDistanceD.mZ.org)) {
                minDistanceD = point
              }
            }
          });

          const sizeD = setSizeGLB(minDistanceD.mesh)
          const sizeA = setSizeGLB(minDistanceA.mesh)

          model.position.copy(getMidpoint(minDistanceA.mesh.position, minDistanceD.mesh.position));
          model.position.y = intersectionPoint.y
          const scaleY = Math.abs(minDistanceD.mesh.position.z - minDistanceA.mesh.position.z)
          const originalSize = setSizeGLB(model)
          const originalScale = model.scale.clone()
          model.scale.z = (scaleY - (sizeD.z / 2 + sizeA.z / 2)) * originalScale.z / originalSize.z
          cabinet.add(model);
          findPoint(cabinet)
        });
      } else if (choice == 1) {
        loader.load(defaultModule1.model, (gltf) => {
          const model = gltf.scene.children[0];
          let minDistanceD
          let minDistanceA
          hearts.forEach(point => {
            if (intersectionPoint.z < point.mZ.max && intersectionPoint.z > point.mZ.min) {
              if (intersectionPoint.y < point.mY.org && (!minDistanceA || point.mY.org < minDistanceA.mY.org)) {
                minDistanceA = point
              } else if (intersectionPoint.y > point.mY.org && (!minDistanceD || point.mY.org > minDistanceD.mY.org)) {
                minDistanceD = point
              }
            }
          });



          const sizeD = setSizeGLB(minDistanceD.mesh)
          const sizeA = setSizeGLB(minDistanceA.mesh)

          model.position.copy(getMidpoint(minDistanceA.mesh.position, minDistanceD.mesh.position));
          model.position.z = intersectionPoint.z
          const scaleZ = Math.abs(minDistanceD.mesh.position.y - minDistanceA.mesh.position.y)
          const originalSize = setSizeGLB(model)
          const originalScale = model.scale.clone()
          model.scale.y = (scaleZ - (sizeD.y / 2 + sizeA.y / 2)) * originalScale.y / originalSize.y
          cabinet.add(model);
          findPoint(cabinet)
        });
      }
    }
  }, [display]);

  const updatePreviewPosition = () => {
    // Sử dụng raycaster để lấy giao điểm với các vật thể trong cảnh
    raycasterRef.current.setFromCamera(mousePositionRef.current, display.camera);

    const intersects = raycasterRef.current.intersectObjects(display.scene.children, true);

    if (intersects.length > 0) {
      // Lấy điểm giao đầu tiên (gần nhất)
      const intersectionPoint = intersects[0].point;

      // Cập nhật vị trí của model xem trước
      previewModelRef.current.position.copy(intersectionPoint);
    }
  };

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current && previewModelRef.current) {
      isDraggingRef.current = false;

      // Tính toán vị trí cuối cùng của chuột trong không gian 3D
      raycasterRef.current.setFromCamera(mousePositionRef.current, display.camera);

      // Mặt phẳng giả định song song với trục Y (mặt đất)
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectionPoint = new THREE.Vector3();

      if (raycasterRef.current.ray.intersectPlane(groundPlane, intersectionPoint)) {
        console.log('Final Mouse 3D Position:', intersectionPoint);

        // Load model thực tại vị trí cuối cùng
        loadRealModel(draggedModuleRef.current, intersectionPoint);

        // Xóa model xem trước (preview)
        display.scene.remove(previewModelRef.current);
        previewModelRef.current = null;
        draggedModuleRef.current = null;
      }
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
          child.material.opacity = 0.5; // Set opacity for the preview
        }
      });
      previewModelRef.current = model;
      display.scene.add(model);
      updatePreviewPosition(); // Position the preview immediately
    });
  };

  const loadRealModel = (moduleData, position) => {
    if (display) {
      const loader = new GLTFLoader();
      loader.load(moduleData.model, (gltf) => {
        const model = gltf.scene;
        model.position.copy(position);
        display.scene.add(model);
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
