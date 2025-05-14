document.addEventListener('DOMContentLoaded', function() {
    const players = [];
    
    // Agregar jugador
    document.getElementById('addPlayer').addEventListener('click', function() {
        const name = document.getElementById('playerName').value.trim();
        if (!name) {
            alert('Por favor ingresa un nombre.');
            return;
        }
        
        const days = Array.from(document.querySelectorAll('.day-selector:checked')).map(el => el.value);
        const startHour = parseInt(document.getElementById('startHour').value);
        const endHour = parseInt(document.getElementById('endHour').value);
        
        if (days.length === 0 || startHour >= endHour) {
            alert('Selecciona al menos un día y un rango de horas válido.');
            return;
        }
        
        const player = {
            name,
            days,
            startHour,
            endHour
        };
        
        players.push(player);
        updatePlayersTable();
        updateMatchesTable();
        
        // Limpiar formulario
        document.getElementById('playerName').value = '';
        document.querySelectorAll('.day-selector').forEach(cb => cb.checked = false);
    });
    
    // Actualizar tabla de jugadores
    function updatePlayersTable() {
        const tbody = document.querySelector('#playersTable tbody');
        tbody.innerHTML = '';
        
        players.forEach(player => {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.textContent = player.name;
            
            const hoursCell = document.createElement('td');
            hoursCell.textContent = `${player.days.join(', ')}: ${player.startHour}:00 - ${player.endHour}:00`;
            
            row.appendChild(nameCell);
            row.appendChild(hoursCell);
            tbody.appendChild(row);
        });
    }
    
    // Actualizar tabla de partidos posibles
    function updateMatchesTable() {
        const tbody = document.querySelector('#matchesTable tbody');
        tbody.innerHTML = '';
        
        // Generar todos los slots posibles (día + hora)
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const timeSlots = [];
        
        days.forEach(day => {
            for (let hour = 9; hour <= 22; hour++) {
                timeSlots.push({ day, hour });
            }
        });
        
        // Para cada slot, ver cuántos jugadores están disponibles
        timeSlots.forEach(slot => {
            const availablePlayers = players.filter(player => 
                player.days.includes(slot.day) && 
                slot.hour >= player.startHour && 
                slot.hour < player.endHour
            );
            
            if (availablePlayers.length >= 6) {
                const row = document.createElement('tr');
                
                const slotCell = document.createElement('td');
                slotCell.textContent = `${slot.day}, ${slot.hour}:00 - ${slot.hour + 1}:00`;
                
                const playersCell = document.createElement('td');
                playersCell.textContent = availablePlayers.map(p => p.name).join(', ');
                
                const statusCell = document.createElement('td');
                if (availablePlayers.length >= 12) {
                    statusCell.textContent = 'Partido 6x6';
                    statusCell.style.color = 'green';
                } else if (availablePlayers.length >= 14) {
                    statusCell.textContent = 'Partido 7x7';
                    statusCell.style.color = 'darkgreen';
                } else if (availablePlayers.length >= 6) {
                    statusCell.textContent = 'Partido posible (menos de 6x6)';
                    statusCell.style.color = 'orange';
                } else {
                    statusCell.textContent = 'Falta quórum';
                    statusCell.style.color = 'red';
                }
                
                row.appendChild(slotCell);
                row.appendChild(playersCell);
                row.appendChild(statusCell);
                tbody.appendChild(row);
            }
        });
    }
});