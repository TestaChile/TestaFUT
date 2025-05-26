document.addEventListener('DOMContentLoaded', function() {
    const players = JSON.parse(localStorage.getItem('players')) || [];
    const lastResetDay = localStorage.getItem('lastResetDay');
    const today = new Date().getDay();
    const venues = ["Club Recrear", "Dominica Sports", "TerraSoccer", "Massocer", "Santa Julia"];
    let globalPreferences = {};
    let currentVenue = null;
    let currentDay = null;

    // Reiniciar datos los domingos
    if (today === 0 && lastResetDay !== '0') {
        localStorage.setItem('players', JSON.stringify([]));
        localStorage.setItem('lastResetDay', '0');
        window.location.reload();
    } else {
        localStorage.setItem('lastResetDay', today.toString());
    }

    // Inicializar SortableJS para las preferencias
    new Sortable(document.getElementById('venuesRanking'), {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function() {
            document.querySelectorAll('#venuesRanking .venue-item').forEach((item, index) => {
                item.textContent = `${index + 1}. ${item.dataset.venue}`;
            });
        }
    });

    // Panel de administrador
    document.getElementById('adminCode').addEventListener('keyup', function(e) {
        if (e.key === 'Enter' && this.value === btoa("1234")) {
            document.getElementById('adminPanel').classList.remove('hidden');
            this.value = '';
        }
    });

    document.getElementById('exportData').addEventListener('click', function() {
        const data = JSON.stringify(players, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jugadores_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    });

    document.getElementById('forceReset').addEventListener('click', function() {
        if (confirm('¿Borrar TODOS los datos permanentemente?')) {
            localStorage.clear();
            window.location.reload();
        }
    });

    // Inicializar interfaz
    updatePlayersList();
    updateCounter();
    updateGlobalPreferences();
    renderAvailabilityGrid();

    // Eventos para los botones de colapso
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
        const position = document.getElementById('playerPosition').value;
        
        if (!name || !position) {
            alert('Completa todos los campos obligatorios');
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

        const preferences = {};
        document.querySelectorAll('#venuesRanking .venue-item').forEach((item, index) => {
            preferences[item.dataset.venue] = index + 1;
        });

        players.push({ 
            name, 
            position,
            availability,
            preferences
        });
        
        localStorage.setItem('players', JSON.stringify(players));
        updatePlayersList();
        updateCounter();
        updateGlobalPreferences();
        renderAvailabilityGrid();
        document.getElementById('playerName').value = '';
        document.getElementById('playerPosition').value = '';
    });

    // Reiniciar datos
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
        
        players.forEach((player, index) => {
            const span = document.createElement('span');
            span.className = `player-name ${index % 2 === 0 ? 'bold' : 'normal'}`;
            span.textContent = player.name;
            list.appendChild(span);
        });
        
        document.getElementById('totalPlayers').textContent = players.length;
    }

    // Actualizar contador
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

    // Verificar partidos posibles
    function checkIfMatchPossible() {
        const dayTimeSlots = {};

        players.forEach(player => {
            player.availability.forEach(slot => {
                const key = `${slot.day}-${slot.time}`;
                if (!dayTimeSlots[key]) {
                    dayTimeSlots[key] = [];
                }
                dayTimeSlots[key].push(player.name);
            });
        });

        return Object.values(dayTimeSlots).some(slot => slot.length >= 12);
    }

    // Actualizar preferencias globales
    function updateGlobalPreferences() {
        venues.forEach(venue => {
            const venuePreferences = players
                .filter(player => player.preferences)
                .map(player => player.preferences[venue] || 5);
            
            globalPreferences[venue] = venuePreferences.length > 0 
                ? venuePreferences.reduce((sum, pref) => sum + pref, 0) / venuePreferences.length
                : 3;
        });
    }

    // Renderizar cuadrícula de disponibilidad
    function renderAvailabilityGrid() {
        const venuesSorted = [...venues].sort((a, b) => globalPreferences[a] - globalPreferences[b]);
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        // Renderizar pestañas de canchas
        const venueTabs = document.querySelector('.venue-tabs');
        venueTabs.innerHTML = venuesSorted.map(venue => `
            <button class="venue-tab ${currentVenue === venue ? 'active' : ''}" 
                    data-venue="${venue}">
                ${venue}
            </button>
        `).join('');

        // Renderizar pestañas de días
        const dayTabs = document.querySelector('.day-tabs');
        dayTabs.innerHTML = dayNames.map((dayName, i) => `
            <button class="day-tab ${currentDay === days[i] ? 'active' : ''}" 
                    data-day="${days[i]}">
                ${dayName}
            </button>
        `).join('');

        // Eventos para pestañas
        document.querySelectorAll('.venue-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                currentVenue = this.dataset.venue;
                renderAvailabilityGrid();
            });
        });

        document.querySelectorAll('.day-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                currentDay = this.dataset.day;
                renderAvailabilityGrid();
            });
        });

        // Seleccionar primera pestaña por defecto
        if (!currentVenue) currentVenue = venuesSorted[0];
        if (!currentDay) currentDay = days[0];

        // Renderizar slots de tiempo
        const timeSlotsGrid = document.querySelector('.time-slots-grid');
        if (currentVenue && currentDay) {
            const timeSlots = getTimeSlotsForDay(currentDay);
            timeSlotsGrid.innerHTML = timeSlots.map(slot => {
                const availablePlayers = players.filter(player => 
                    player.availability.some(av => 
                        av.day === currentDay && av.time === slot
                    )
                );

                return `
                    <div class="time-slot-card">
                        <span>${slot}</span>
                        <div class="time-slot-players">
                            ${availablePlayers.map(player => `
                                <div class="player-icon" 
                                     title="${player.name} (${player.position}, Pref: ${player.preferences[currentVenue]})"
                                     style="background-color: ${getPositionColor(player.position)}">
                                    ${player.name.charAt(0)}${player.preferences[currentVenue]}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Obtener slots de tiempo para un día
    function getTimeSlotsForDay(day) {
        const slotsMap = {
            monday: ['13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', 
                    '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00', 
                    '21:00-22:00', '22:00-23:00'],
            // ... otros días con sus horarios ...
        };
        return slotsMap[day] || [];
    }

    // Color según posición
    function getPositionColor(position) {
        const colors = {
            'arquero': '#3498db',
            'defensa': '#2ecc71',
            'mediocampista': '#e67e22',
            'delantero': '#e74c3c'
        };
        return colors[position] || '#9b59b6';
    }
});
