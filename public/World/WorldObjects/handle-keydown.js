export const keyStates = {}
export const mouseDown = {}

import { gun, keydownHandler } from "../../app.js";


document.addEventListener( 'keydown', ( event ) => {

    keyStates[ event.code ] = true;

    if(event.code == 'KeyR') gun.reload()
    keydownHandler(event.code)
} );

document.addEventListener( 'keyup', ( event ) => {

    keyStates[ event.code ] = false;

} );

document.addEventListener( 'mousedown', (e) => {
    
    mouseDown[e.button] = true

})

document.addEventListener( 'mouseup', (e) => {

    mouseDown[e.button] = false

})