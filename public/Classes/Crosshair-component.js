export class Crosshair {
    constructor() {
        this.assaultRifle = new AssaultRifle()
        this.shotgun = new Shotgun()

        this.keys = {
            'M416': this.assaultRifle,
            'S1897': this.shotgun
        }

        this.active = this.assaultRifle
    }

    get dist() {
        return this.active.dist
    }

    changeCrosshair(k) {
        this.remove()
        this.active = this.keys[k]
        this.add()
    }

    update(state) {
        this.active.update(state)
    }

    remove() {
        this.active.elements.forEach(element => {
            element.style.display = 'none'
        })
    }

    add() {
        this.active.elements.forEach(element => {
            element.style.display = 'block'
        })
    }
}

class Shotgun {
    constructor() {
        this.width = 3
        this.blockWidth = 5
        this.dist = 5

        this.stateMap = {
            'idle.ADS': 10,
            'idle': 10,
        
            'walk.ADS': 15,
            'walk': 15,
        
            'run.ADS': 20,
            'run': 20,
        }
        
        this.dot = document.createElement('div')
        this.dot.style.height = this.width + 'px'
        this.dot.style.width = this.width + 'px'
        this.dot.classList.add('crosshair-element')

        this.ne = this.createDiv('ne')
        this.nw = this.createDiv('nw')
        this.se = this.createDiv('se')
        this.sw = this.createDiv('sw')

        this.elements = [this.ne, this.nw, this.se, this.sw, this.dot]

        this.container = document.querySelector('#container')

        this.initalize()
    }

    initalize() {
        this.elements.forEach(element => {
            this.container.appendChild(element)
            element.style.display = 'none'
        })
    }


    createDiv(c) {
        let div = document.createElement('div')
        div.style.height = this.blockWidth + 'px'
        div.style.width = this.blockWidth + 'px'
        div.classList.add('shotgun-crosshair')
        div.classList.add(c)
        return div
    }

    update(state) {
        this.dist = this.stateMap[state]

        let middleX = (window.innerWidth / 2) - (this.width / 2)
        let middleY = (window.innerHeight / 2) - (this.width / 2)
        this.dot.style.top = middleY + 'px'
        this.dot.style.left = middleX + 'px'

        this.ne.style.top = middleY - this.dist - (this.blockWidth / 2) + 'px'
        this.ne.style.left = middleX + this.dist - (this.blockWidth / 2) + 1 + 'px'

        this.nw.style.top = middleY - this.dist - (this.blockWidth / 2) + 'px'
        this.nw.style.left = middleX - this.dist - (this.blockWidth / 2) + 'px'

        this.se.style.top = middleY + this.dist - (this.blockWidth / 2) + 1 + 'px'
        this.se.style.left = middleX + this.dist  - (this.blockWidth / 2) + 1 + 'px'

        this.sw.style.top = middleY + this.dist - (this.blockWidth / 2) + 1 + 'px'
        this.sw.style.left = middleX - this.dist - (this.blockWidth / 2) + 'px'

    }
}

class AssaultRifle {
    constructor() {
        this.width = 3
        this.height = 10
        this.dist = 5

        this.stateMap = {
            'idle.ADS': 4,
            'idle': 20,
        
            'walk.ADS': 20,
            'walk': 35,
        
            'run.ADS': 35,
            'run': 60,
        }

        this.dot = document.createElement('div')
        this.dot.style.height = this.width + 'px'
        this.dot.style.width = this.width + 'px'
        this.dot.classList.add('crosshair-element')

        this.north = document.createElement('div')
        this.north.style.height = this.height + 'px'
        this.north.style.width = this.width + 'px'
        this.north.classList.add('crosshair-element')

        this.east = document.createElement('div')
        this.east.style.height = this.width + 'px'
        this.east.style.width = this.height + 'px'
        this.east.classList.add('crosshair-element')

        this.west = document.createElement('div')
        this.west.style.height = this.width + 'px'
        this.west.style.width = this.height + 'px'
        this.west.classList.add('crosshair-element')

        this.south = document.createElement('div')
        this.south.style.height = this.height + 'px'
        this.south.style.width = this.width + 'px'
        this.south.classList.add('crosshair-element')

        this.elements = [this.north, this.south, this.east, this.west, this.dot]
    
        this.container = document.querySelector('#container')

        this.initalize()
    }

    initalize() {
        this.elements.forEach(element => {
            this.container.appendChild(element)
        })
    }


    update(state) {
        this.dist = this.stateMap[state]
        
        let middleX = (window.innerWidth / 2) - (this.width / 2)
        let middleY = (window.innerHeight / 2) - (this.width / 2)
        this.dot.style.top = middleY + 'px'
        this.dot.style.left = middleX + 'px'

        this.north.style.left = middleX + 'px'
        this.north.style.top = middleY - this.dist - this.height + this.width + 'px'

        this.east.style.left = middleX + this.dist + 'px'
        this.east.style.top = middleY + 'px'

        this.south.style.left = middleX + 'px'
        this.south.style.top = middleY + this.dist + 'px'

        this.west.style.left = middleX - this.dist - this.height + this.width + 'px'
        this.west.style.top = middleY + 'px'
    }
}