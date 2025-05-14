document.addEventListener('DOMContentLoaded', function() {
    const players = JSON.parse(localStorage.getItem('players')) || [];
    const lastResetDay = localStorage.getItem('lastResetDay');
    const today = new Date().getDay(); // 0 (domingo) a 6 (sábado)

    // Reiniciar datos si es domingo y no se ha reiniciado hoy
    if (today === 0 && lastResetDay !== '0') {
        localStorage.setItem('players', JSON.stringify([]));
        localStorage.setItem('lastResetDay', '0');
        window.location.reload();
    }

    // Actualizar interfaz
    updatePlayersList();
    updateCounter();

    // Colapsar/expandir días
    document.querySelectorAll('.collapse-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const slots = this.nextElementSibling;
            slots.style.display = slots.style.display === 'block' ? 'none' : 'block';
            this.innerHTML = this.innerHTML.includes('▼') 
                ? this.innerHTML.replace('▼', '▲') 
                : this.innerHTML.replace('▲', '▼');
        });
    });

    // Agregar jugador
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

    // Reiniciar datos manualmente
    document.getElementById('resetData').addEventListener('click', function() {
        if (confirm('¿Borrar todos los jugadores?')) {
            localStorage.setItem('players', JSON.stringify([]));
            window.location.reload();
        }
    });

    // Actualizar lista de jugadores
    function updatePlayersList() {
        const list = document.getElementById('playersList');
        list.innerHTML = '';
        players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.name;
            list.appendChild(li);
        });
        document.getElementById('totalPlayers').textContent = players.length;
    }

    // Actualizar contador y estado del partido
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

    // Verificar si hay horarios compatibles
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
