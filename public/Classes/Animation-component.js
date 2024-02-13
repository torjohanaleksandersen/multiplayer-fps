import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { FBXLoader } from "../World/WorldObjects/FBXLoader/FBXLoader.js"

let animKeys = {
    'idle': 'Rifle Idle.fbx',
    'walk': 'Rifle Walk.fbx',
    'run': 'Rifle Run.fbx',

    'idle.ADS': 'Rifle Aiming Idle.fbx',
    'walk.ADS': 'Walking.fbx',
    'run.ADS': 'Rifle Aiming Run.fbx',

    'dead': 'Death From The Back.fbx',
    'dead.ADS': 'Death From The Back.fbx'
}

export class AnimationComponent {
    constructor(mixer) {
        this.mixer = mixer
        this.animations = {}
        this.dead = false

        this.loader = new FBXLoader()
        this.loader.setPath('./Animations/')
        for (const type in animKeys) {
            this.loader.load(animKeys[type], (animations) => {
                this.animations[type] = this.mixer.clipAction(animations.animations[0])

                if (type === 'dead') {
                    this.animations[type].setLoop(THREE.LoopOnce);
                    this.animations[type].clampWhenFinished = true
                }
            })
        }
    }

    playAnimation(name) {
        if(name == 'dead' && this.dead == true) return

        if(this.animations[name]) {
            for (const key in this.animations) {
                this.animations[key].fadeOut(0.2);
            }

            this.animations[name].reset().fadeIn(0.2).play();
        }
    }

    update() {
        this.mixer.update(0.02)
    }
}