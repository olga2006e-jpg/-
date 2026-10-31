import * as THREE from 'three';
import { soundEngine } from './audio.js';

export class PlayerControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.enabled = false;
    this.isLocked = false;

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

  unlock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  update(delta) {
    if (!this.enabled) return;

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

    // Campus perimeter clamping: player can NEVER fall into the void!
    const bound = 78;
    this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x + deltaX, -bound, bound);
    this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z + deltaZ, -bound, bound);

    this.camera.position.y = 1.6; // Fixed eye-height
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
