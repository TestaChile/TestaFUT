// Primero el listener del Modo Dios (fuera de DOMContentLoaded para mejor organización)
document.getElementById('godModeBtn')?.addEventListener('click', function() {
    if (document.getElementById('adminCode').value === '2565') {
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('resetData').style.display = 'inline-block';
        alert('Modo Dios Activado');
    } else {
        alert('Código incorrecto');
    }
});

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
        
        if (!name) {
            alert('Ingresa tu nombre');
            return;
        }
        
        if (!position) {
            alert('Selecciona tu posición');
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
    });

    // Reiniciar datos
    document.getElementById('resetData')?.addEventListener('click', function() {
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
            span.textContent = `${player.name} (${player.position})`;
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
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes','Sábado','Domingo'];

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
                            ${availablePlayers.map(player => {
                                const pref = player.preferences[currentVenue];
                                return `
                                    <div class="player-icon" 
                                         title="${player.name} (Pref: ${pref})"
                                         data-pref="${pref}">
                                        ${player.name.charAt(0)}
                                    </div>
                                `;
                            }).join('')}
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
            tuesday: ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', 
                     '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', 
                     '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', 
                     '22:00-23:00'],
            wednesday: ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', 
                       '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', 
                       '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', 
                       '22:00-23:00'],
            thursday: ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', 
                      '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', 
                      '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', 
                      '22:00-23:00'],
            friday: ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', 
                   '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', 
                   '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', 
                   '22:00-23:00'],
            saturday: ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', 
                      '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', 
                      '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', 
                      '22:00-23:00'],
            sunday: ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', 
                   '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', 
                   '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', 
                   '22:00-23:00']
        };
        return slotsMap[day] || [];
    }
});
