import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'




export default class Loaders {
	constructor(ThreeEnvironment) {
        const {renderer} = ThreeEnvironment;
        this.setupLoaders();


    }

    setupLoaders(){
		this.gltfLoader = new GLTFLoader();
        this.fbxLoader = new FBXLoader()
    }


    // GLTF Loader
	loadGltfByUrl(url) {
		return new Promise((resolve, reject) => {
			this.gltfLoader.load(
				url,
				(gltf) => {
					resolve(gltf);
				},
				(xhr) => {},
				(error) => {
					console.log("Error Occured while loading model: ", error);
					reject(error);
				}
			);
		});
	}


    loadFBXByUrl(url){
		return new Promise((resolve, reject) => {
            this.fbxLoader.load(
                url,
                (model) => {
					resolve(model);
                },
                (xhr) => {
                    // console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
                },
                (error) => {
                    console.log(error)
                }
            )
        });
    }
    

    loadModels(modelPaths) {
        const loadPromises = Object.entries(modelPaths).map(([modelName, modelPath]) => {
            return new Promise((resolve, reject) => {
                console.log(`Loading ${modelName}`);
                this.loadFBXByUrl(modelPath, modelName)
                    .then(gltf => {
                        console.log(`Loaded ${modelName}`)
                        resolve({ [modelName]: gltf });
                    })
                    .catch(error => {
                        reject(error);
                    });
            });
        });
    
        return Promise.all(loadPromises)
            .then(modelsArray => {
                // Combine the loaded models into a single object
                return modelsArray.reduce((accumulator, current) => {
                    return { ...accumulator, ...current };
                }, {});
            });
    }
    
    
}