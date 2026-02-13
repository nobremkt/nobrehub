import { useSettingsStore } from '@/features/settings/stores/useSettingsStore';

export interface Scene {
    sceneNumber: number;
    narration: string;
    imagePrompt: string;
    mood: string;
}

const GEMINI_MODEL = 'gemini-3-flash-preview';

async function loadSystemPrompt(): Promise<string> {
    try {
        const response = await fetch('/prompts/scene-separator.md');
        if (!response.ok) {
            console.error('Failed to load system prompt:', response.statusText);
            // Fallback if file is missing
            return 'Você é um roteirista visual. Retorne JSON com cenas.';
        }
        return await response.text();
    } catch (error) {
        console.error('Error loading system prompt:', error);
        return '';
    }
}

export async function separateScenes(script: string, style: string = 'Cinematic'): Promise<Scene[]> {
    const apiKey = useSettingsStore.getState().gemini.apiKey;
    if (!apiKey) throw new Error('API Key do Gemini não configurada.');

    const baseSystemPrompt = await loadSystemPrompt();

    // Construct the full prompt
    const fullPrompt = `${baseSystemPrompt}

---

# INPUTS DO USUÁRIO

**Roteiro**:
${script}

**Estilo Visual / Vibe**:
${style}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: fullPrompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json" // Force JSON mode
            }
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Erro na API Gemini (${response.status})`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
        throw new Error('Retorno vazio do Gemini.');
    }

    try {
        // Clean markdown code blocks if present (though responseMimeType should handle it)
        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed: Scene[] = JSON.parse(cleanJson);

        if (!Array.isArray(parsed)) throw new Error('O retorno não é uma lista de cenas.');

        return parsed;
    } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Raw Text:', textResponse);
        throw new Error('Falha ao processar o retorno do roteiro.');
    }
}
