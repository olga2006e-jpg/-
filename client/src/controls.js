import * as THREE from 'three';
import { soundEngine } from './audio.js';
import { PlayerBody } from './playerBody.js';
import { createPlayerAvatar } from './environment.js';
export class PlayerControls {
  constructor(camera, domElement, scene = null) {
    this.camera = camera;
    this.domElement = domElement;
    this.scene = scene;

    this.enabled = false;
    this.isLocked = false;
    this.playerBody = new PlayerBody(this.camera, this.scene);
    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;

    // Speeds & Physics
    this.walkSpeed = 10.0;
    this.sprintSpeed = 16.0;
    this.baseY = 1.6;
    this.velocityY = 0;
    this.gravity = 22.0;
    this.jumpSpeed = 7.5;
    this.isGrounded = true;
    this.jumpRequested = false;
    this.pitch = 0; // vertical
    this.yaw = 0;   // horizontal
    this.mouseSensitivity = 0.0022;

    // Third-person & Camera View Mode
    this.cameraMode = 'firstPerson'; // 'firstPerson' | 'thirdPerson'
    this.cameraDistance = 2.8;
    this.minDistance = 1.2;
    this.maxDistance = 5.0;
    this.playerPos = new THREE.Vector3(0, 1.6, 0);
    this.thirdPersonMesh = null;
    this.playerName = 'Вы';
    this.playerColor = '#8be9fd';

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.chunkManager = null;

    this.domElement.addEventListener('click', () => {
      if (!this.enabled) return;
      if (document.pointerLockElement !== this.domElement) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.isLocked || !this.enabled) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      this.yaw -= movementX * this.mouseSensitivity;
      this.pitch -= movementY * this.mouseSensitivity;

      // Clamp vertical pitch to avoid flipping (-85 deg to +85 deg)
      const maxPitch = Math.PI / 2 - 0.05;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

      // Apply rotation to camera if in first person
      if (this.cameraMode === 'firstPerson') {
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
      }
    });

    // Mouse wheel zoom to seamlessly toggle 1st and 3rd person
    window.addEventListener('wheel', (e) => {
      if (!this.enabled || !this.isLocked) return;
      if (e.deltaY > 0) {
        if (this.cameraMode === 'firstPerson') {
          this.setCameraMode('thirdPerson');
        } else {
          this.cameraDistance = Math.min(this.maxDistance, this.cameraDistance + 0.35);
        }
      } else if (e.deltaY < 0) {
        if (this.cameraMode === 'thirdPerson') {
          this.cameraDistance -= 0.35;
          if (this.cameraDistance < this.minDistance) {
            this.setCameraMode('firstPerson');
          }
        }
      }
    }, { passive: true });

    this.setupKeyboard();
    window.addEventListener("blur", () => this.resetMovement());
  }
  setChunkManager(chunkManager) {
    this.chunkManager = chunkManager;
  }

  setupKeyboard() {
    const onKeyDown = (event) => {
      if (!this.enabled) return;

      // Don't capture keys if typing in chat or modal
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea') return;

      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.isSprinting = true;
          break;
        case 'Space':
          if (this.isGrounded) {
            this.jumpRequested = true;
          }
          break;
        case 'KeyV':
        case 'KeyC':
          this.toggleCameraMode();
          break;
      }
    };
    const onKeyUp = (event) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.isSprinting = false;
          break;
        case 'Space':
          this.jumpRequested = false;
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  resetMovement() {
    this.moveForward=this.moveBackward=this.moveLeft=this.moveRight=this.isSprinting=this.jumpRequested=false;
    this.velocity.set(0,0,0);
  }

  unlock() {
    this.resetMovement();
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  update(delta) {
    if (!this.enabled || document.activeElement?.matches('input, textarea') || document.querySelector('.modal-overlay:not(.hidden)')) {
      this.resetMovement();
      return;
    }

    const speed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;

    // Damping
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
    if (isMoving && this.isGrounded) {
      soundEngine.playFootstep();
    }
    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * speed * delta * 12.0;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x += this.direction.x * speed * delta * 12.0;
    }

    // Move in local horizontal plane based on yaw
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const forwardX = -sinYaw;
    const forwardZ = -cosYaw;
    const rightX = cosYaw;
    const rightZ = -sinYaw;

    const deltaX = (forwardX * (-this.velocity.z) + rightX * this.velocity.x) * delta;
    const deltaZ = (forwardZ * (-this.velocity.z) + rightZ * this.velocity.x) * delta;

    const oldX = this.playerPos.x;
    const oldZ = this.playerPos.z;
    const playerRadius = 0.45;
    const playerY = this.playerPos.y;

    let nextX = oldX + deltaX;
    let nextZ = oldZ + deltaZ;

    // Robust sliding AABB collision against ALL physical scene obstacles
    if (this.chunkManager) {
      const boxes = this.chunkManager.getCollisionBoxes(oldX, oldZ, 10, playerY);

      // --- 1. Solve X axis with continuous sliding clamp ---
      for (const b of boxes) {
        if (oldZ + playerRadius > b.minZ && oldZ - playerRadius < b.maxZ) {
          if (nextX > oldX && nextX + playerRadius > b.minX && oldX + playerRadius <= b.minX + 0.08) {
            nextX = b.minX - playerRadius;
          } else if (nextX < oldX && nextX - playerRadius < b.maxX && oldX - playerRadius >= b.maxX - 0.08) {
            nextX = b.maxX + playerRadius;
          } else if (nextX + playerRadius > b.minX && nextX - playerRadius < b.maxX) {
            const dLeft = Math.abs(nextX + playerRadius - b.minX);
            const dRight = Math.abs(b.maxX - (nextX - playerRadius));
            nextX = dLeft < dRight ? b.minX - playerRadius : b.maxX + playerRadius;
          }
        }
      }

      // --- 2. Solve Z axis with continuous sliding clamp ---
      for (const b of boxes) {
        if (nextX + playerRadius > b.minX && nextX - playerRadius < b.maxX) {
          if (nextZ > oldZ && nextZ + playerRadius > b.minZ && oldZ + playerRadius <= b.minZ + 0.08) {
            nextZ = b.minZ - playerRadius;
          } else if (nextZ < oldZ && nextZ - playerRadius < b.maxZ && oldZ - playerRadius >= b.maxZ - 0.08) {
            nextZ = b.maxZ + playerRadius;
          } else if (nextZ + playerRadius > b.minZ && nextZ - playerRadius < b.maxZ) {
            const dBack = Math.abs(nextZ + playerRadius - b.minZ);
            const dFront = Math.abs(b.maxZ - (nextZ - playerRadius));
            nextZ = dBack < dFront ? b.minZ - playerRadius : b.maxZ + playerRadius;
          }
        }
      }
    }

    // Campus perimeter clamping
    const bound = 35.3;
    this.playerPos.x = THREE.MathUtils.clamp(nextX, -bound, bound);
    this.playerPos.z = THREE.MathUtils.clamp(nextZ, -bound, bound);

    // Handle Jumping & Vertical Gravity
    if (this.jumpRequested && this.isGrounded) {
      this.velocityY = this.jumpSpeed;
      this.isGrounded = false;
      this.jumpRequested = false;
      soundEngine.playJump?.();
    }

    if (!this.isGrounded) {
      this.velocityY -= this.gravity * delta;
      let nextY = this.playerPos.y + this.velocityY * delta;
      if (nextY <= this.baseY) {
        nextY = this.baseY;
        this.velocityY = 0;
        this.isGrounded = true;
        soundEngine.playFootstep(); // Landing impact
      } else if (nextY > 4.2) {
        nextY = 4.2;
        this.velocityY = 0;
      }
      this.playerPos.y = nextY;
    } else {
      this.playerPos.y = this.baseY;
    }

    // Camera positioning based on view mode (1st person vs 3rd person)
    if (this.cameraMode === 'thirdPerson') {
      const mesh = this.ensureThirdPersonMesh();
      if (mesh) {
        mesh.position.set(this.playerPos.x, this.playerPos.y - 1.6, this.playerPos.z);
        mesh.rotation.y = this.yaw;
      }

      // Over-the-shoulder third-person camera
      const sinYaw = Math.sin(this.yaw);
      const cosYaw = Math.cos(this.yaw);
      const cosPitch = Math.cos(this.pitch);
      const sinPitch = Math.sin(this.pitch);

      const shoulderOffset = 0.42;
      const camOffsetX = (sinYaw * cosPitch) * this.cameraDistance + (cosYaw * shoulderOffset);
      const camOffsetY = (-sinPitch * this.cameraDistance) + 0.35;
      const camOffsetZ = (cosYaw * cosPitch) * this.cameraDistance - (sinYaw * shoulderOffset);

      let targetCamX = this.playerPos.x + camOffsetX;
      let targetCamY = THREE.MathUtils.clamp(this.playerPos.y + camOffsetY, 0.4, 4.8);
      let targetCamZ = this.playerPos.z + camOffsetZ;

      targetCamX = THREE.MathUtils.clamp(targetCamX, -35.0, 35.0);
      targetCamZ = THREE.MathUtils.clamp(targetCamZ, -35.0, 35.0);

      this.camera.position.set(targetCamX, targetCamY, targetCamZ);
      this.camera.lookAt(this.playerPos.x, this.playerPos.y + 0.15, this.playerPos.z);
    } else {
      // First-person view
      this.camera.position.set(this.playerPos.x, this.playerPos.y, this.playerPos.z);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    }

    // Update player first-person body viewmodel & lantern sway
    if (this.playerBody && this.cameraMode === 'firstPerson') {
      this.playerBody.update(delta, isMoving, this.pitch);
    }
  }

  setPlayerInfo(username, color) {
    this.playerName = username || this.playerName;
    this.playerColor = color || this.playerColor;
    if (this.thirdPersonMesh && this.scene) {
      this.scene.remove(this.thirdPersonMesh);
      this.thirdPersonMesh = null;
    }
    this.ensureThirdPersonMesh();
  }

  ensureThirdPersonMesh() {
    if (!this.thirdPersonMesh && this.scene) {
      this.thirdPersonMesh = createPlayerAvatar(this.playerName, this.playerColor);
      this.thirdPersonMesh.visible = this.cameraMode === 'thirdPerson';
      this.scene.add(this.thirdPersonMesh);
    }
    return this.thirdPersonMesh;
  }

  toggleCameraMode() {
    this.setCameraMode(this.cameraMode === 'firstPerson' ? 'thirdPerson' : 'firstPerson');
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    const isThird = mode === 'thirdPerson';
    this.ensureThirdPersonMesh();
    if (this.thirdPersonMesh) {
      this.thirdPersonMesh.visible = isThird;
    }
    if (this.playerBody && this.playerBody.viewmodel) {
      this.playerBody.viewmodel.visible = !isThird;
    }
  }

  getPosition() {
    return {
      x: this.playerPos.x,
      y: this.playerPos.y,
      z: this.playerPos.z,
      rotY: this.yaw
    };
  }

  setPosition(x, y, z, rotY = 0) {
    const posY = Number.isFinite(y) ? y : 1.6;
    this.baseY = posY;
    this.velocityY = 0;
    this.isGrounded = true;
    this.playerPos.set(x, posY, z);
    this.yaw = rotY;
    if (this.cameraMode === 'firstPerson') {
      this.camera.position.set(x, posY, z);
      this.camera.rotation.y = rotY;
    } else {
      const mesh = this.ensureThirdPersonMesh();
      if (mesh) {
        mesh.position.set(x, posY - 1.6, z);
        mesh.rotation.y = rotY;
      }
    }
  }
}
