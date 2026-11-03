const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// --- 1. CONFIGURAÇÃO DO MAPA TIPO GOOGLE MAPS ---
const origemCoords = [-23.4628, -46.5333]; // Guarulhos
const map = L.map('map').setView(origemCoords, 4);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let currentMarker = L.marker(origemCoords).addTo(map)
    .bindPopup('Sua localização atual:<br><b>Guarulhos, SP</b>').openPopup();

// --- 2. CONFIGURAÇÃO DO CHAT E INTEGRAÇÃO SEGURA ---
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
    
    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('avatar');
    avatarDiv.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('content');
    
    if (sender === 'ai') {
        contentDiv.innerHTML = marked.parse(text); 
    } else {
        contentDiv.textContent = text;
    }

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function checkDestinationAndMoveMap(text) {
    const txtLower = text.toLowerCase();
    let destino = null;
    let lat = 0, lng = 0;

    if(txtLower.includes('suíça') || txtLower.includes('suica')) { destino = 'Suíça'; lat = 46.8182; lng = 8.2275; }
    else if(txtLower.includes('paris') || txtLower.includes('frança')) { destino = 'Paris, França'; lat = 48.8566; lng = 2.3522; }
    else if(txtLower.includes('japão') || txtLower.includes('japao') || txtLower.includes('tóquio')) { destino = 'Japão'; lat = 36.2048; lng = 138.2529; }
    else if(txtLower.includes('nova york') || txtLower.includes('eua')) { destino = 'Nova York, EUA'; lat = 40.7128; lng = -74.0060; }
    
    if (destino) {
        map.flyTo([lat, lng], 5, { duration: 3 });
        setTimeout(() => {
            map.removeLayer(currentMarker);
            currentMarker = L.marker([lat, lng]).addTo(map).bindPopup(`<b>Destino:</b> ${destino}`).openPopup();
        }, 3000);
        
        // Atualiza os widgets laterais com base no destino detectado
        updateWidgetsContent(destino);
    }
}

function updateWidgetsContent(destino) {
    const newsWidget = document.getElementById('news-widget');
    const promosWidget = document.getElementById('promos-widget');

    newsWidget.innerHTML = `
        <ul style="list-style: none;">
            <li style="margin-bottom: 8px; font-size: 13px;"><a href="https://www.google.com/search?q=turismo+${encodeURIComponent(destino)}+atualidades" target="_blank" style="color: #1e3a8a; text-decoration: none;">📰 Dicas essenciais e atualizadas para visitar ${destino}</a></li>
        </ul>`;

    promosWidget.innerHTML = `
        <div class="promo-card" style="background: white; padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #f59e0b;">
            <a href="https://www.google.com/travel/flights?q=voos+de+GRU+para+${encodeURIComponent(destino)}" target="_blank" style="text-decoration: none; color: inherit;">
                <p style="font-weight: bold; font-size: 13px;">Pesquisar voos GRU ✈️ ${destino}</p>
                <span style="color: #16a34a; font-weight: bold; font-size: 12px;">Ver cotações no Google Flights</span>
            </a>
        </div>`;
}

async function fetchAIResponse(userText) {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'ai-message');
    typingDiv.innerHTML = `<div class="avatar"><i class="fa-solid fa-robot"></i></div><div class="content typing-indicator">Analisando rotas a partir de Guarulhos...</div>`;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/.netlify/functions/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userText: userText })
        });
        
        if (!response.ok) throw new Error("Erro de comunicação com o servidor seguro.");

        const data = await response.json();
        
        chatBox.removeChild(typingDiv);
        addMessage(data.reply, 'ai');

    } catch (error) {
        chatBox.removeChild(typingDiv);
        addMessage("Desculpe, ocorreu um erro. Verifique sua conexão e tente novamente.", 'ai');
        console.error(error);
    }
}

sendBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (text) {
        addMessage(text, 'user');
        checkDestinationAndMoveMap(text);
        userInput.value = '';
        fetchAIResponse(text);
    }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// --- 3. DADOS REAIS: Cotação de Moedas ---
async function fetchRealTimeCurrency() {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        
        const brl = data.rates.BRL;
        const eur = data.rates.BRL / data.rates.EUR;
        const chf = data.rates.BRL / data.rates.CHF;

        const widgetExchange = document.querySelector('.exchange');
        if(widgetExchange) {
            widgetExchange.innerHTML = `
                <p><strong>USD:</strong> R$ ${brl.toFixed(2)}</p>
                <p><strong>EUR:</strong> R$ ${eur.toFixed(2)}</p>
                <p><strong>CHF:</strong> R$ ${chf.toFixed(2)}</p>
                <p style="font-size:10px; color:#666; margin-top:5px; text-align:right;">Dados ao vivo</p>
            `;
        }
    } catch (err) {
        console.error("Erro ao buscar cotações:", err);
    }
}
fetchRealTimeCurrency();