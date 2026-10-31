import * as THREE from 'three';
import { soundEngine } from './audio.js';
import { PlayerBody } from './playerBody.js';

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

    // Speeds
    this.walkSpeed = 10.0;
    this.sprintSpeed = 16.0;

    // Euler rotation angles
    this.pitch = 0; // vertical
    this.yaw = 0;   // horizontal
    this.mouseSensitivity = 0.0022;

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

      // Apply rotation to camera
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    });

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
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  resetMovement() {
    this.moveForward=this.moveBackward=this.moveLeft=this.moveRight=this.isSprinting=false;
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
    if (isMoving) {
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

    const oldX = this.camera.position.x;
    const oldZ = this.camera.position.z;
    const playerRadius = 0.45;
    const playerY = this.camera.position.y;

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
            // Safety push-out if embedded
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
            // Safety push-out if embedded
            const dBack = Math.abs(nextZ + playerRadius - b.minZ);
            const dFront = Math.abs(b.maxZ - (nextZ - playerRadius));
            nextZ = dBack < dFront ? b.minZ - playerRadius : b.maxZ + playerRadius;
          }
        }
      }
    }

    // Campus perimeter clamping: player can NEVER fall into the void!
    const bound = 35.3;
    this.camera.position.x = THREE.MathUtils.clamp(nextX, -bound, bound);
    this.camera.position.z = THREE.MathUtils.clamp(nextZ, -bound, bound);

    this.camera.position.y = 1.6;

    // Update player first-person body viewmodel & lantern sway
    if (this.playerBody) {
      this.playerBody.update(delta, isMoving, this.pitch);
    }
  }
  getPosition() {
    return {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
      rotY: this.yaw
    };
  }

  setPosition(x, y, z, rotY = 0) {
    this.camera.position.set(x, y || 1.6, z);
    this.yaw = rotY;
    this.camera.rotation.y = rotY;
  }
}
