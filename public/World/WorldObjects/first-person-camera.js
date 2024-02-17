import { PointerLockControls } from "./PointerLockControls.js"

export class FirstPersonCamera {
    constructor(camera, renderer) {
        this.controls = new PointerLockControls(camera, renderer.domElement)
        this.controls.pointerSpeed = 0.5
    }
}