import { useEffect } from 'react';
import { useOrganizationStore } from '../stores/useOrganizationStore';

/**
 * Função auxiliar para clarear/escurecer cores hex
 * (Implementação simplificada para gerar shades)
 */
function adjustBrightness(hex: string, percent: number) {
    // Remove # se existir
    hex = hex.replace(/^#/, '');

    // Parse r, g, b
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Ajusta brilho
    r = Math.floor(r * (1 + percent / 100));
    g = Math.floor(g * (1 + percent / 100));
    b = Math.floor(b * (1 + percent / 100));

    // Clamp 0-255
    r = r < 255 ? r : 255;
    g = g < 255 ? g : 255;
    b = b < 255 ? b : 255;
    r = r > 0 ? r : 0;
    g = g > 0 ? g : 0;
    b = b > 0 ? b : 0;

    const rr = (r.toString(16).length === 1) ? '0' + r.toString(16) : r.toString(16);
    const gg = (g.toString(16).length === 1) ? '0' + g.toString(16) : g.toString(16);
    const bb = (b.toString(16).length === 1) ? '0' + b.toString(16) : b.toString(16);

    return '#' + rr + gg + bb;
}

/**
 * Hook para aplicar as cores do tema dinamicamente
 */
export const useThemeApplier = () => {
    const { primaryColor } = useOrganizationStore();

    useEffect(() => {
        if (!primaryColor) return;

        const root = document.documentElement;

        // Gera shades baseados na cor primária (simulação aproximada do Tailwind colors)
        // Valores de ajuste empíricos para criar uma escala
        const shades = {
            50: adjustBrightness(primaryColor, 180),   // Muito claro
            100: adjustBrightness(primaryColor, 150),
            200: adjustBrightness(primaryColor, 120),
            300: adjustBrightness(primaryColor, 80),
            400: adjustBrightness(primaryColor, 40),
            500: primaryColor,                         // Base
            600: adjustBrightness(primaryColor, -10),
            700: adjustBrightness(primaryColor, -20),
            800: adjustBrightness(primaryColor, -30),
            900: adjustBrightness(primaryColor, -40),
            950: adjustBrightness(primaryColor, -50),
        };

        // Aplica variáveis CSS
        Object.entries(shades).forEach(([key, value]) => {
            root.style.setProperty(`--color-primary-${key}`, value);
        });

        // Também atualiza variáveis derivadas que podem estar usando cores fixas se houver
        // Por enquanto, o sistema de design usa --color-primary-500 etc diretamente.

    }, [primaryColor]);
};
