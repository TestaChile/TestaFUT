document.addEventListener('DOMContentLoaded', function() {
    const players = JSON.parse(localStorage.getItem('players')) || [];
    const lastResetDay = localStorage.getItem('lastResetDay');
    const today = new Date().getDay();

    if (today === 0 && lastResetDay !== '0') {
        localStorage.setItem('players', JSON.stringify([]));
        localStorage.setItem('lastResetDay', '0');
        window.location.reload();
    }

    updatePlayersList();
    updateCounter();

    document.querySelectorAll('.collapse-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const slots = this.nextElementSibling;
            slots.style.display = slots.style.display === 'block' ? 'none' : 'block';
            this.innerHTML = this.innerHTML.includes('▼') 
                ? this.innerHTML.replace('▼', '▲') 
                : this.innerHTML.replace('▲', '▼');
        });
    });

    document.getElementById('addPlayer').addEventListener('click', function() {
        const name = document.getElementById('playerName').value.trim();
        if (!name) {
            alert('Ingresa tu nombre');
            return;
        }

        const availability = [];
        document.querySelectorAll('.day-slots input[type="checkbox"]:checked').forEach(checkbox => {
            availability.push({
                day: checkbox.name,
                time: checkbox.value
            });
        });

        if (availability.length === 0) {
            alert('Selecciona al menos un horario');
            return;
        }

        players.push({ name, availability });
        localStorage.setItem('players', JSON.stringify(players));
        
        updatePlayersList();
        updateCounter();
        document.getElementById('playerName').value = '';
    });

    document.getElementById('resetData').addEventListener('click', function() {
        if (confirm('¿Borrar todos los jugadores?')) {
            localStorage.setItem('players', JSON.stringify([]));
            window.location.reload();
        }
    });

    function updatePlayersList() {
        const list = document.getElementById('playersList');
        list.innerHTML = '';
        
        players.forEach((player, index) => {
            const span = document.createElement('span');
            span.className = `player-name ${index % 2 === 0 ? 'bold' : 'normal'}`;
            span.textContent = player.name;
            list.appendChild(span);
        });
        
        document.getElementById('totalPlayers').textContent = players.length;
    }

    function updateCounter() {
        const remaining = 12 - players.length;
        const countText = document.getElementById('countText');
        const matchStatus = document.getElementById('matchStatus');

        if (remaining > 0) {
            countText.textContent = `¡Faltan ${remaining} jugadores!`;
            matchStatus.textContent = '';
        } else {
            countText.textContent = '¡12 jugadores registrados!';
            const canPlay = checkIfMatchPossible();
            matchStatus.textContent = canPlay 
                ? '✅ Partido concretado!' 
                : '❌ No coinciden horarios';
            matchStatus.style.color = canPlay ? 'green' : 'red';
        }
    }

    function checkIfMatchPossible() {
        const timeSlots = {};
        players.forEach(player => {
            player.availability.forEach(slot => {
                const key = `${slot.day}-${slot.time}`;
                timeSlots[key] = (timeSlots[key] || 0) + 1;
            });
        });

        return Object.values(timeSlots).some(count => count >= 12);
    }
});
