import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import ThirdPersonControls from "./ThirdPersonControls";

// Custom Scripts
import Loaders from "./Loaders";

export default class MaterialEnvTest {
	constructor(ThreeEnvironment) {
		const { scene, camera, controls } = ThreeEnvironment;
		this.scene = scene;
		this.camera = camera;
		this.controls = controls;
		this.loaders = new Loaders(ThreeEnvironment);
		this.clock = new THREE.Clock();
		this.animations = [];
		// this.createPlane();
		this.addModel();
		this.keypadControls();
	}

	async addModel() {
		this.loaders.loadGltfByUrl("/models/western_city/scene.gltf")
		.then((gltf) => {
			this.scene.add(gltf.scene);
			gltf.scene.position.y = -0.1;
		})

		
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

				const filteredAnimations = animations
					.map((animation) => {
						let modifiedName = modelName.replace(/[_\s]/g, ""); // Remove underscores and spaces from animation name
						modifiedName = modifiedName.replace("maximo.com", ""); // Remove "maximo.com" from animation name
						animation.name = modifiedName;
						return animation;
					})
					.filter(
						(animation) =>
							!animation.name.startsWith("Take") &&
							animation.tracks.length > 0
					);
			
				this.animations.push(...filteredAnimations);
			}
		}


		ninjaModel.animations = this.animations;
		this.scene.add(ninjaModel);
		ninjaModel.scale.set(0.01, 0.01, 0.01);
		ninjaModel.position.x = 10;
		ninjaModel.position.z = 20;
		ninjaModel.rotation.y = Math.PI;

		console.log(ninjaModel);

		const gltfAnimations = ninjaModel.animations;
		const mixer = new THREE.AnimationMixer(ninjaModel);
		const animationsMap = new Map();

		gltfAnimations.forEach((a) => { animationsMap.set(a.name, mixer.clipAction(a));});

		console.log(animationsMap.get('NinjaKick'))
		animationsMap.get('NinjaKick').timeScale = 1.5;
		animationsMap.get('NinjaFastRun').timeScale = 0.5;

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
						// console.log("Shift Key Pressed!");
						this.characterControls.switchRunToggle();
					} else {
						this.keysPressed[event.key.toLowerCase()] = true;
						// console.log("Another Key Pressed!");
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
