document.addEventListener('DOMContentLoaded', function() {
    const players = [];
    const days = [
        { id: 'monday', name: 'Lunes', slots: ['13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', '22:00-23:00'] },
        { id: 'tuesday', name: 'Martes', slots: ['9:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', '22:00-23:00'] },
        { id: 'wednesday', name: 'Miércoles', slots: ['9:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', '22:00-23:00'] },
        { id: 'thursday', name: 'Jueves', slots: ['9:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', '22:00-23:00'] },
        { id: 'friday', name: 'Viernes', slots: ['9:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', '22:00-23:00'] },
        { id: 'saturday', name: 'Sábado', slots: ['9:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', '22:00-23:00'] },
        { id: 'sunday', name: 'Domingo', slots: ['9:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', '22:00-23:00'] }
    ];

    // Generar checkboxes para cada día
    days.forEach(day => {
        const container = document.getElementById(`${day.id}-slots`);
        day.slots.forEach(slot => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" name="${day.id}" value="${slot}">
                ${slot}
            `;
            container.appendChild(label);
        });
    });

    // Seleccionar todos los horarios de un día
    document.querySelectorAll('.select-all').forEach(button => {
        button.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            const checkboxes = document.querySelectorAll(`input[name="${day}"]`);
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            
            checkboxes.forEach(cb => {
                cb.checked = !allChecked;
            });
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
        document.querySelectorAll('.time-slots input[type="checkbox"]:checked').forEach(checkbox => {
            const day = checkbox.name;
            const time = checkbox.value;
            availability.push({ day, time });
        });

        if (availability.length === 0) {
            alert('Selecciona al menos un horario');
            return;
        }

        players.push({ name, availability });
        updatePlayersTable();
        updateMatchesList();
        document.getElementById('playerName').value = '';
    });

    // Actualizar tabla de jugadores
    function updatePlayersTable() {
        const tbody = document.querySelector('#playersTable tbody');
        tbody.innerHTML = '';
        
        players.forEach(player => {
            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            nameCell.textContent = player.name;
            
            const slotsCell = document.createElement('td');
            const slotsByDay = {};
            
            player.availability.forEach(slot => {
                if (!slotsByDay[slot.day]) slotsByDay[slot.day] = [];
                slotsByDay[slot.day].push(slot.time);
            });
            
            let slotsText = '';
            Object.keys(slotsByDay).forEach(day => {
                const dayName = days.find(d => d.id === day).name;
                slotsText += `${dayName}: ${slotsByDay[day].join(', ')}\n`;
            });
            
            slotsCell.textContent = slotsText;
            row.appendChild(nameCell);
            row.appendChild(slotsCell);
            tbody.appendChild(row);
        });
    }

    // Actualizar lista de partidos posibles
    function updateMatchesList() {
        const matchesList = document.getElementById('matchesList');
        matchesList.innerHTML = '';
        
        // Agrupar disponibilidad por día y hora
        const timeSlots = {};
        days.forEach(day => {
            day.slots.forEach(slot => {
                const key = `${day.name} - ${slot}`;
                timeSlots[key] = players.filter(player => 
                    player.availability.some(av => 
                        av.day === day.id && av.time === slot
                    )
                );
            });
        });

        // Mostrar solo slots con al menos 6 jugadores
        Object.keys(timeSlots).forEach(slot => {
            const playersInSlot = timeSlots[slot];
            if (playersInSlot.length >= 6) {
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';
                
                let statusClass, statusText;
                if (playersInSlot.length >= 12) {
                    statusClass = 'full';
                    statusText = '6x6 COMPLETO';
                } else if (playersInSlot.length >= 10) {
                    statusClass = 'ready';
                    statusText = '6x6 POSIBLE';
                } else {
                    statusClass = 'quorum';
                    statusText = 'FALTA QUÓRUM';
                }
                
                matchCard.innerHTML = `
                    <h3>${slot}</h3>
                    <div class="players">
                        <i class="fas fa-users"></i> 
                        ${playersInSlot.map(p => p.name).join(', ')}
                    </div>
                    <span class="status ${statusClass}">${statusText} (${playersInSlot.length} jugadores)</span>
                `;
                
                matchesList.appendChild(matchCard);
            }
        });
    }
});
