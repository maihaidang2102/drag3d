import { useState, useEffect, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

export const useDragDropPreview = (scene, camera, raycaster) => {
  const [isDragging, setIsDragging] = useState(false);
  const previewModelRef = useRef(null);
  const mousePosition = useRef(new THREE.Vector2());

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!isDragging || !camera) return;
      const rect = event.target.getBoundingClientRect();
      mousePosition.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mousePosition.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update preview position
      raycaster.setFromCamera(mousePosition.current, camera);
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersects = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, intersects);
      
      if (previewModelRef.current) {
        previewModelRef.current.position.copy(intersects);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, camera, raycaster]);

  const startDrag = (module) => {
    setIsDragging(true);
    const loader = new GLTFLoader();
    loader.load(module.model, (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.5; // Set opacity to make the preview semi-transparent
        }
      });
      scene.add(model); // Add the preview model to the scene
      previewModelRef.current = model;
    });
  };

  const stopDrag = () => {
    setIsDragging(false);
    if (previewModelRef.current) {
      scene.remove(previewModelRef.current); // Remove preview model when dragging stops
      previewModelRef.current = null;
    }
  };

  return { startDrag, stopDrag };
};
