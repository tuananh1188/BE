const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCxgkfaZFTONb1lSZciJbtzMoX-oCkfX-0');
        const data = await response.json();
        const models = data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'));
        console.log('models supporting generateContent:');
        models.forEach(m => console.log(m.name));
    } catch (e) {
        console.error('error:', e.message);
    }
}
run();
