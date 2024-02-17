import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class AudioController {
    constructor(camera) {
        this.camera = camera;
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        this.positionalSounds = [];
        this.globalSounds = [];
        this.actionSounds = {};

        this.initializeBackgroundAudio()
    }

    initializeBackgroundAudio() {
        this.backgroundAudio = document.getElementById('background-audio')
        this.backgroundAudio.volume = 1
        document.addEventListener('click', () => {
            this.playBackgroundAudio()
        })
        this.backgroundAudio.addEventListener('ended', () => {
            this.playBackgroundAudio()
        })
    }

    playBackgroundAudio() {
        this.backgroundAudio.play()
    }

    createPosition(position) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(),
            new THREE.MeshStandardMaterial()
        );
        mesh.position.set(...position);
        const positionalSound = new THREE.PositionalAudio(this.listener);
        mesh.add(positionalSound);
        this.positionalSounds.push(positionalSound);
        return positionalSound;
    }

    playPositionalAudio(url, position) {
        const positionalSound = this.createPosition(position);
        this.positionalLoader = new THREE.AudioLoader();
        this.positionalLoader.load(url, (buffer) => {
            positionalSound.setBuffer(buffer);
            positionalSound.setRefDistance(20);
            positionalSound.setRolloffFactor(200);
            positionalSound.play();
        });
    }

    playAudio(url) {
        const sound = new THREE.Audio(this.listener);
        this.globalSounds.push(sound);
        this.globalLoader = new THREE.AudioLoader();
        this.globalLoader.load(url, (buffer) => {
            sound.setBuffer(buffer);
            sound.setVolume(0.5);
            sound.play();
        });
    }
    

    
    handleActions(url, state) {
        if (this.actionPlaying && this.actionSounds[this.actionPlaying]) {
            // If there's an audio instance for the previous state, stop it
            this.actionSounds[this.actionPlaying].stop();
            delete this.actionSounds[this.actionPlaying]; // Remove reference to the sound associated with the previous state
        }
    
        if (state === 'idle' || state === 'run') {
            if (state === 'run') {
                const sound = new THREE.Audio(this.listener);
                this.globalLoader = new THREE.AudioLoader();
                this.globalLoader.load(url, (buffer) => {
                    sound.setBuffer(buffer);
                    sound.setVolume(0.3);
                    sound.setPlaybackRate(1.7); // Set playback rate to 2 for running
                    sound.play();
                    this.actionSounds[state] = sound; // Store the audio instance for the current state
                    this.actionPlaying = state; // Update the current state
                });
            }
            return; // No need to play sound for idle or run states
        }
    
        const sound = new THREE.Audio(this.listener);
        this.globalLoader = new THREE.AudioLoader();
        this.globalLoader.load(url, (buffer) => {
            sound.setBuffer(buffer);
            sound.setVolume(0.3);
            sound.setPlaybackRate(1.3)
            sound.play();
            this.actionSounds[state] = sound; // Store the audio instance for the current state
            this.actionPlaying = state; // Update the current state
        });
    }
    
}
