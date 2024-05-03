import * as THREE from "three";
import { colorSpaceToLinear } from "three/examples/jsm/nodes/Nodes.js";

const W = "w";
const A = "a";
const S = "s";
const D = "d";
const SHIFT = "shift";
const DIRECTIONS = [W, A, S, D];

export default class ThirdPersonControls {
	model;
	mixer;
	animationsMap = new Map(); // Walk, Run, Idle
	orbitControl;
	camera;

	// state
	toggleRun = false;
	toggleStop = false;
	currentAction;

	// temporary data
	walkDirection = new THREE.Vector3();
	rotateAngle = new THREE.Vector3(0, 1, 0);
	rotateQuarternion = new THREE.Quaternion();
	cameraTarget = new THREE.Vector3();

	// constants
	fadeDuration = 0.2;
	runVelocity = 5;
	walkVelocity = 2;

	constructor(
		model,
		mixer,
		animationsMap,
		orbitControl,
		camera,
		currentAction
	) {
		this.model = model;
		this.mixer = mixer;
		this.animationsMap = animationsMap;
		this.currentAction = currentAction;
		this.animationsMap.forEach((value, key) => {
			if (key == currentAction) {
				value.play();
			}
		});
		this.orbitControl = orbitControl;
		this.camera = camera;
		this.#updateCameraTarget(this.model.position.x, this.model.position.z);
	}

	switchRunToggle() {
		this.toggleRun = !this.toggleRun;
	}
	switchStopToggle() {
		this.toggleStop = !this.toggleStop;
	}

	#updateCameraTarget(moveX, moveZ) {
		// move camera
		this.camera.position.x -= moveX;
		this.camera.position.z -= moveZ;

		// update camera target
		this.cameraTarget.x = this.model.position.x;
		this.cameraTarget.y = this.model.position.y + 1;
		this.cameraTarget.z = this.model.position.z;
		this.orbitControl.target = this.cameraTarget;
	}

	#directionOffset(keysPressed) {
		let directionOffset = 0;

		if (keysPressed[W]) {
			if (keysPressed[A]) directionOffset = -Math.PI / 4 - Math.PI / 2;
			else if (keysPressed[D])
				directionOffset = Math.PI / 4 + Math.PI / 2;
			else directionOffset = Math.PI;
		} else if (keysPressed[S]) {
			if (keysPressed[A]) directionOffset = Math.PI / 4 - Math.PI / 2;
			else if (keysPressed[D])
				directionOffset = -Math.PI / 4 + Math.PI / 2;
			else directionOffset = 0;
		} 
        else if (keysPressed[A]) directionOffset = -Math.PI / 2;
		else if (keysPressed[D]) directionOffset = Math.PI / 2;

		return directionOffset;
	}

	update(delta, keysPressed) {
		const directionPressed = DIRECTIONS.some( (key) => keysPressed[key] == true );

		var play = "";
		if (directionPressed && this.toggleRun) { play = "NinjaFastRun";}
        else if(keysPressed.f){ play = "NinjaPunch" }  
        else if(keysPressed.g){ play = "NinjaKick" }  
        else if (directionPressed) { play = "NinjaWalking"; }
        else if(keysPressed.c){ play = 'SecretWalking'}
        else if(keysPressed.o){ play = 'NinjaLowCrawl'}
        else { play = "NinjaIdle"; }

		if (this.currentAction != play) {
			const toPlay = this.animationsMap.get(play);
			const current = this.animationsMap.get(this.currentAction);
			current.fadeOut(this.fadeDuration);
			toPlay.reset().fadeIn(this.fadeDuration).play();
			this.currentAction = play;
		}

		this.mixer.update(delta);

		if (
			this.currentAction == "NinjaWalking" ||
			this.currentAction == "NinjaFastRun" ||
            this.currentAction == "SecretWalking" ||
			this.currentAction == "NinjaLowCrawl"
		) {
			// calculate towards camera direction
			var angleYCameraDirection = Math.atan2(
				this.camera.position.x - this.model.position.x,
				this.camera.position.z - this.model.position.z
			);
			// diagonal movement angle offset
			var directionOffset = this.#directionOffset(keysPressed);

			// rotate model
			this.rotateQuarternion.setFromAxisAngle(
				this.rotateAngle,
				angleYCameraDirection + directionOffset
			);
			this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);

			// calculate direction
			this.camera.getWorldDirection(this.walkDirection);
			this.walkDirection.y = 0;
			this.walkDirection.normalize();
			this.walkDirection.applyAxisAngle(
				this.rotateAngle,
				directionOffset
			);

			// run/walk velocity
			const velocity =
				this.currentAction == "NinjaFastRun"
					? this.runVelocity
					: this.walkVelocity;

			// move model & camera
			const moveX = this.walkDirection.x * velocity * delta;
			const moveZ = this.walkDirection.z * velocity * delta;
			this.model.position.x -= moveX;
			this.model.position.z -= moveZ;
			this.#updateCameraTarget(moveX, moveZ);
		}
	}
}
