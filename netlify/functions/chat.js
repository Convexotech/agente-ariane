exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const userText = body.userText;
        
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "A chave API_KEY não foi encontrada nas variáveis de ambiente." })
            };
        }

        const systemPrompt = `
        Você é um guia turístico e um agente de viagens virtual de ponta.
        Objetivo: Planejar e auxiliar viajantes, fornecendo roteiro, financeiro, burocracia, idiomas e dicas.
        O usuário está partindo de Guarulhos, São Paulo, Brasil.
        REGRA CRÍTICA: Você deve fornecer informações reais e atuais. Sempre que mencionar um hotel, companhia aérea, atração turística ou serviço, VOCÊ DEVE incluir um link real e clicável usando o formato Markdown. Exemplo: [Site Oficial do Louvre](https://www.louvre.fr).
        Organize suas respostas em tópicos e tabelas didáticas.
        `;

        const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:8888',
                'X-Title': 'Travel Agent AI'
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-120b",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userText }
                ]
            })
        });

        const data = await response.json();

        // Se a API retornar erro, devolvemos a mensagem exata do OpenRouter para a tela
        if (!response.ok) {
            const errorMsg = data.error?.message || JSON.stringify(data);
            console.error("Erro OpenRouter:", errorMsg);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: `Erro OpenRouter: ${errorMsg}` })
            };
        }

        const aiText = data.choices[0].message.content;

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: aiText })
        };

    } catch (error) {
        console.error("Erro interno:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erro interno no servidor: " + error.message })
        };
    }
};