// Add your bot tokens here, you can add multiple tokens separated by comma
const BOT_TOKENS = [];
// Example : const botTokens = ["bot_token_1", "bot_token_2", "bot_token_3"];


// CORS Fix Start

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

async function handleOptions(request) {
    if (
        request.headers.get("Origin") !== null &&
        request.headers.get("Access-Control-Request-Method") !== null &&
        request.headers.get("Access-Control-Request-Headers") !== null
    ) {
        return new Response(null, {
            headers: corsHeaders,
        });
    } else {
        return new Response(null, {
            headers: {
                Allow: "GET, HEAD, POST, OPTIONS",
            },
        });
    }
}

// CORS Fix End



function getBotToken() {
    const pos = Math.floor(Math.random() * BOT_TOKENS.length);
    return BOT_TOKENS[pos];
}

function generateRandomString(length) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let randomString = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        randomString += chars.substring(randomIndex, randomIndex + 1);
    }
    return randomString;
}

async function getJson(url) {
    const response = await fetch(url);
    return await response.json();
}

async function downloadFile(CHANNEL_ID, message_id) {
    const botToken = getBotToken();

    const x = generateRandomString(10);
    let url = `https://api.telegram.org/bot${botToken}/editMessageCaption?chat_id=${CHANNEL_ID}&message_id=${message_id}&caption=${x}`;
    console.log(url);
    let data = await getJson(url);
    console.log(data);
    const fileId = data.result.document.file_id;
    const file_name = data.result.document.file_name;
    const file_size = data.result.document.file_size;

    url = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
    console.log(url);
    data = await getJson(url);
    console.log(data);
    const file_path = data.result.file_path;

    url = `https://api.telegram.org/file/bot${botToken}/${file_path}`;
    console.log(url);
    const file = await fetch(url);
    return [await file.arrayBuffer(), file_name, file_size];
}

export default {
    async fetch(request, env, ctx) {
        if (request.method === "OPTIONS") {
            // Handle CORS preflight requests
            return await handleOptions(request);
        } else if (
            request.method === "GET" ||
            request.method === "HEAD" ||
            request.method === "POST"
        ) {
            const url = new URL(request.url);
            const path = url.pathname;

            if (path.includes('/file/')) {
                const x = path.split('/file/')[1].split('/');
                const CHANNEL_ID = x[0]
                const fileID = x[1]
                console.log(CHANNEL_ID, fileID)
                const y = await downloadFile(CHANNEL_ID, fileID);
                console.log(y)
                const data = y[0]
                const file_name = y[1]
                const file_size = y[2]

                return new Response(data, {
                    status: 200, headers: {
                        "Content-Disposition": `attachment; filename=${file_name}`,
                        "Content-Length": file_size,
                        ...corsHeaders
                    }
                });
            }
            return new Response('TG DL Api Working!\n\nUsage : /file/CHANNEL_ID/MESSAGE_ID', { status: 200, headers: corsHeaders });
        } else {
            return new Response('Method Not Allowed', { status: 405 });
        }
    }
}