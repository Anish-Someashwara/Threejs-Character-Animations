import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import ThirdPersonControls from "./ThirdPersonControls";

// Custom Scripts
import Loaders from "./Loaders";
import { mod } from "three/examples/jsm/nodes/Nodes.js";

export default class MaterialEnvTest {
	constructor(ThreeEnvironment) {
		const { scene, camera, controls } = ThreeEnvironment;
		this.scene = scene;
		this.camera = camera;
		this.controls = controls;
		this.loaders = new Loaders(ThreeEnvironment);
		this.clock = new THREE.Clock();
		this.animations = [];
		this.createPlane();
		this.addModel();
		this.keypadControls();
	}

	async addModel() {
		const MODELS_PATHS = {
			Ninja: "/models/Ninja/Ninja.fbx",
			NinjaRunForward: "/models/Ninja/NinjaRunForward.fbx",
			NinjaWalking: "/models/Ninja/NinjaWalking.fbx",
			NinjaFastRun: "/models/Ninja/NinjaFastRun.fbx",
			SecretWalking: "/models/Ninja/SecretWalking.fbx",
			SneakWalk: "/models/Ninja/SneakWalk.fbx",
			NinjaKick: "/models/Ninja/NinjaKick.fbx",
			NinjaPunch: "/models/Ninja/NinjaPunch.fbx",
			NinjaIdle: "/models/Ninja/NinjaIdle.fbx",
			NinjaLowCrawl: "/models/Ninja/NinjaLowCrawl.fbx"
		};
		const loadedModels = await this.loaders.loadModels(MODELS_PATHS);
		console.log(loadedModels);
		const ninjaModel = loadedModels["Ninja"];
		ninjaModel.animations = [];

		// Iterate over loaded models
		for (const modelName in loadedModels) {
			if (loadedModels.hasOwnProperty(modelName)) {
				const model = loadedModels[modelName];
				const animations = model.animations;

				// Modify animation names based on the model name and filter animations
				const filteredAnimations = animations
					.map((animation) => {
						// Remove underscores and spaces from animation name
						let modifiedName = modelName.replace(/[_\s]/g, "");
						// Remove "maximo.com" from animation name
						modifiedName = modifiedName.replace("maximo.com", "");
						// Assign modified name to animation
						animation.name = modifiedName;
						return animation;
					})
					.filter(
						(animation) =>
							!animation.name.startsWith("Take") &&
							animation.tracks.length > 0
					);
				// Filter animations whose name doesn't start with "Take" and have non-zero tracks length

				// Push modified animations to global animations array
				this.animations.push(...filteredAnimations);
			}
		}

		// this.animations.pop();

		ninjaModel.animations = this.animations;
		this.scene.add(ninjaModel);
		ninjaModel.scale.set(0.01, 0.01, 0.01);
		ninjaModel.rotation.y = Math.PI;

		console.log(ninjaModel);

		const gltfAnimations = ninjaModel.animations;
		const mixer = new THREE.AnimationMixer(ninjaModel);
		const animationsMap = new Map();

		gltfAnimations.forEach((a) => {
			animationsMap.set(a.name, mixer.clipAction(a));
		});

		console.log(animationsMap.get('NinjaKick'))
		animationsMap.get('NinjaKick').timeScale = 1.5;

		this.characterControls = new ThirdPersonControls(
			ninjaModel,
			mixer,
			animationsMap,
			this.controls,
			this.camera,
			"NinjaIdle"
		);
	}

	addGUIControls() {
		const gui = new GUI();
	}

	createPlane() {
		const WIDTH = 80;
		const LENGTH = 80;

		const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 255, 255);
		const material = new THREE.MeshStandardMaterial({
			color: "red",
			wireframe: true,
		});

		const floor = new THREE.Mesh(geometry, material);
		floor.rotation.x = -Math.PI / 2;
		this.scene.add(floor);
	}

	keypadControls() {
		this.keysPressed = {};
		document.addEventListener(
			"keydown",
			(event) => {
				console.log(event.key)
				if (event.key != "a" && event.key != "d"){
					if (event.shiftKey) {
						console.log("Shift Key Pressed!");
						this.characterControls.switchRunToggle();
					} else {
						this.keysPressed[event.key.toLowerCase()] = true;
						console.log("Another Key Pressed!");
					}
				}
			},
			false
		);

		document.addEventListener(
			"keyup",
			(event) => {
				this.keysPressed[event.key.toLowerCase()] = false;
			},
			false
		);
	}

	update() {
		let mixerUpdateDelta = this.clock.getDelta();
		if (this.characterControls) {
			this.characterControls.update(mixerUpdateDelta, this.keysPressed);
		}
	}
}
