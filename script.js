// Función para activar/desactivar Modo Dios
document.getElementById('godModeBtn')?.addEventListener('click', function() {
    if (document.getElementById('adminCode').value === '2565') {
        const adminPanel = document.getElementById('adminPanel');
        adminPanel.style.display = adminPanel.style.display === 'block' ? 'none' : 'block';
        renderAvailabilityGrid();
        alert(adminPanel.style.display === 'block' ? 'Modo Dios ACTIVADO' : 'Modo Dios DESACTIVADO');
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
        resetAllData();
    } else {
        localStorage.setItem('lastResetDay', today.toString());
    }

    // Renderizar preferencias de cancha
    renderVenuePreferences();

    // Inicializar SortableJS
    new Sortable(document.getElementById('venuesRanking'), {
        animation: 150,
        ghostClass: 'sortable-ghost',
        handle: '.venue-item',
        onEnd: updateVenuePreferences
    });

    // Inicializar interfaz
    updateInterface();

    // Event listeners
    setupEventListeners();

    // Función para reiniciar todos los datos
    function resetAllData() {
        localStorage.setItem('players', JSON.stringify([]));
        localStorage.setItem('lastResetDay', '0');
        window.location.reload();
    }

    // Función para actualizar la interfaz
    function updateInterface() {
        updatePlayersList();
        updateCounter();
        updateGlobalPreferences();
        renderAvailabilityGrid();
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Botones de colapso
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
        document.getElementById('addPlayer').addEventListener('click', addPlayer);

        // Reiniciar datos (admin)
        document.getElementById('forceReset')?.addEventListener('click', function() {
            if (confirm('¿Borrar TODOS los jugadores?')) {
                resetAllData();
            }
        });

        // Toggle números de preferencia
        document.getElementById('togglePrefNumbers')?.addEventListener('click', function() {
            renderAvailabilityGrid();
        });
    }

    // Añadir nuevo jugador
    function addPlayer() {
        const name = document.getElementById('playerName').value.trim();
        const position = document.getElementById('playerPosition').value;
        
        if (!name) return alert('Ingresa tu nombre');
        if (!position) return alert('Selecciona tu posición');

        const availability = getSelectedTimeSlots();
        if (availability.length === 0) return alert('Selecciona al menos un horario');

        const { preferences, activeVenues } = getVenuePreferences();

        players.push({ name, position, availability, preferences, activeVenues });
        saveAndUpdate();
    }

    // Obtener horarios seleccionados
    function getSelectedTimeSlots() {
        const availability = [];
        document.querySelectorAll('.day-slots input[type="checkbox"]:checked').forEach(checkbox => {
            availability.push({
                day: checkbox.name,
                time: checkbox.value
            });
        });
        return availability;
    }

    // Obtener preferencias de cancha
    function getVenuePreferences() {
        const preferences = {};
        const activeVenues = [];
        
        document.querySelectorAll('#venuesRanking .venue-item:not(.disabled)').forEach((item, index) => {
            preferences[item.dataset.venue] = index + 1;
            activeVenues.push(item.dataset.venue);
        });

        return { preferences, activeVenues };
    }

    // Guardar y actualizar
    function saveAndUpdate() {
        localStorage.setItem('players', JSON.stringify(players));
        document.getElementById('playerName').value = '';
        updateInterface();
    }

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
                dayTimeSlots[key] = dayTimeSlots[key] || [];
                dayTimeSlots[key].push(player.name);
            });
        });

        return Object.values(dayTimeSlots).some(slot => slot.length >= 12);
    }

    // Actualizar preferencias globales
    function updateGlobalPreferences() {
        venues.forEach(venue => {
            const venuePreferences = players
                .filter(player => player.preferences && player.activeVenues.includes(venue))
                .map(player => player.preferences[venue] || 5);
            
            globalPreferences[venue] = venuePreferences.length > 0 
                ? venuePreferences.reduce((sum, pref) => sum + pref, 0) / venuePreferences.length
                : 3;
        });
    }

    // Renderizar preferencias de cancha
    function renderVenuePreferences() {
        const venuesRanking = document.getElementById('venuesRanking');
        venuesRanking.innerHTML = '<p>Ordena tus preferencias (1 = más preferido):</p>';
        
        venues.forEach(venue => {
            const venueItem = document.createElement('div');
            venueItem.className = 'venue-item';
            venueItem.dataset.venue = venue;
            venueItem.textContent = venue;
            
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'toggle-venue-btn';
            toggleBtn.textContent = 'Desactivar';
            toggleBtn.onclick = function() {
                venueItem.classList.toggle('disabled');
                this.textContent = venueItem.classList.contains('disabled') ? 'Activar' : 'Desactivar';
                updateVenuePreferences();
            };
            
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'space-between';
            container.appendChild(venueItem);
            container.appendChild(toggleBtn);
            
            venuesRanking.appendChild(container);
        });
    }

    // Actualizar preferencias de cancha
    function updateVenuePreferences() {
        document.querySelectorAll('#venuesRanking .venue-item:not(.disabled)').forEach((item, index) => {
            item.textContent = `${index + 1}. ${item.dataset.venue}`;
        });
        updateGlobalPreferences();
        renderAvailabilityGrid();
    }

    // Renderizar cuadrícula de disponibilidad
    function renderAvailabilityGrid() {
        const venuesSorted = [...venues].sort((a, b) => globalPreferences[a] - globalPreferences[b]);
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes','Sábado','Domingo'];
        const isAdminMode = document.getElementById('adminPanel').style.display === 'block';

        // Renderizar pestañas
        renderTabs('.venue-tabs', venuesSorted, currentVenue, 'venue');
        renderTabs('.day-tabs', dayNames, currentDay, 'day', days);

        // Seleccionar primera pestaña por defecto
        currentVenue = currentVenue || venuesSorted[0];
        currentDay = currentDay || days[0];

        // Renderizar slots de tiempo
        renderTimeSlots();
    }

    // Renderizar pestañas
    function renderTabs(selector, items, current, type, itemsData = null) {
        const tabs = document.querySelector(selector);
        tabs.innerHTML = items.map((item, i) => {
            const value = itemsData ? itemsData[i] : item;
            return `
                <button class="${type}-tab ${current === value ? 'active' : ''}" 
                        data-${type}="${value}">
                    ${item}
                </button>
            `;
        }).join('');

        // Event listeners para pestañas
        document.querySelectorAll(`${selector} button`).forEach(tab => {
            tab.addEventListener('click', function() {
                if (type === 'venue') currentVenue = this.dataset.venue;
                if (type === 'day') currentDay = this.dataset.day;
                renderAvailabilityGrid();
            });
        });
    }

    // Renderizar slots de tiempo
    function renderTimeSlots() {
        const timeSlotsGrid = document.querySelector('.time-slots-grid');
        if (!currentVenue || !currentDay) return;

        const timeSlots = getTimeSlotsForDay(currentDay);
        const isAdminMode = document.getElementById('adminPanel').style.display === 'block';

        timeSlotsGrid.innerHTML = timeSlots.map(slot => {
            const availablePlayers = players.filter(player => 
                player.availability.some(av => av.day === currentDay && av.time === slot) && 
                player.activeVenues.includes(currentVenue)
            );

            return `
                <div class="time-slot-card">
                    <span>${slot}</span>
                    <div class="time-slot-players">
                        ${availablePlayers.map(player => renderPlayerIcon(player, isAdminMode)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Renderizar ícono de jugador
    function renderPlayerIcon(player, showPref) {
        const pref = player.preferences[currentVenue];
        return `
            <div class="player-icon ${player.position}" 
                 title="${player.name} (${player.position})${showPref ? ' - Pref: ' + pref : ''}"
                 ${showPref ? 'data-pref="' + pref + '"' : ''}>
                ${player.name.charAt(0)}
            </div>
        `;
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
