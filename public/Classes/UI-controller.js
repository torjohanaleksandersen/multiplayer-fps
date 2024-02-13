export class UserInterface {
    constructor() {
        this.domElements = {
            info: document.querySelector('.info'),
            ammo: document.querySelector('.ammo'),
            health: document.querySelector('#health-amount'),
            ammoIngun: document.getElementById('ammo-ingun'),
            ammoTotal: document.getElementById('ammo-total'),
            death: document.querySelector('.death-screen'),
            leaderboard: document.querySelector('.leaderboard'),
        }

        this.leaderboard = []
    }

    createDiv(c) {
        let div = document.createElement('div')
        div.classList.add(c)
        return div
    }

    makeLeaderboardLine(line) {
        let row = this.createDiv('lboard-row')
        let types = ['rank', 'name', 'kills', 'deaths']
        let box = null
        for (let i = 0; i < types.length; i++) {
            box = this.createDiv('lboard-' + types[i])
            box.innerText = line[i]
            row.appendChild(box)
        }
        return row
    }

    updateLeaderboard(players) {
        this.leaderboard = players

        this.leaderboard.sort((a, b) => b[2] - a[2]);

        this.leaderboard = this.leaderboard.map((player, index) => [index + 1, ...player.slice(1)]);

        for (let i = this.domElements.leaderboard.children.length - 1; i >= 1; i--) {
            const elem = this.domElements.leaderboard.children[i];
            this.domElements.leaderboard.removeChild(elem);
        }
        
        for (let i = 0; i < this.leaderboard.length; i++) {
            const element = this.leaderboard[i];
            const div = this.makeLeaderboardLine(element)
            this.domElements.leaderboard.appendChild(div)
        }
    }

    reload(total) {
        let width = 0
        let timeElapsed = 0
        let maxWidth = 200
        this.interval = setInterval(() => {
            width = maxWidth * timeElapsed / total
            document.getElementById('reload-time').style.width = width + 'px'
            timeElapsed += 10
            if(timeElapsed >= total) {
                this.stopReload()
                return
            }
        }, 10)
    }

    stopReload() {
        clearInterval(this.interval)
        document.getElementById('reload-time').style.width = '0'
    }

    kills(amount) {
        document.getElementById('kills').innerText = amount
    }

    killed(player) {
        this.domElements.death.style.display = 'flex'
        this.domElements.death.classList.add('fade-in')

        let doc = document.querySelector('.death-name')
        doc.innerText = player
        setTimeout(() => {
            this.domElements.death.style.display = 'none'
            doc.innerText = ''
            this.domElements.death.classList.remove('fade-in')
        }, 5000)
    }

    addKillLine(gamertag) {
        let line = this.createDiv('kill-or-assist-line');
        let f = document.createElement('span')
        f.classList.add('killed')
        f.innerText = 'KILLED '
        let s = document.createElement('span')
        s.classList.add('gamertag')
        s.innerText = gamertag
        line.appendChild(f)
        line.appendChild(s)
        document.getElementById('container').appendChild(line);
        
        line.style.top = "90vh";
        line.offsetHeight;
        line.style.top = "70vh";

        const keyframes = [
            { opacity: '0' },
            { opacity: '1' },
        ];
    
        const options = {
            duration: 1000,
            iterations: 1,
            fill: "forwards",
        };
    
        line.animate(
            keyframes,
            options
        );
    
        setTimeout(() => {
            line.animate(
                [keyframes[1], keyframes[0]],
                options
            )
            setTimeout(() => {
                document.getElementById('container').removeChild(line);
            }, options.duration * 4)
        }, options.duration * 3);
    }

    updateAmmo(ammo, total) {
        this.domElements.ammoIngun.innerText = ammo
        this.domElements.ammoTotal.innerText = total
    }

    health(health) {
        let width = null
        if(health < 0) {
            width = 0
        } else {
            width = health * 3
        }
        this.domElements.health.style.width = width + 'px'
        const r = 255
        const gb = Math.round((health * 2.55));
        this.domElements.health.style.backgroundColor = `rgb(${r}, ${gb}, ${gb})`;
    }

    hitAnimation(color) {
        let targetHit = document.querySelector('.crosshair-hit')
        targetHit.classList.add('fade-in-and-out')
        for (let i = 0; i < targetHit.children.length; i++) {
            targetHit.children[i].style.backgroundColor = color
        }
        setTimeout(() => {
            targetHit.classList.remove('fade-in-and-out')
        }, 200)
    }
}