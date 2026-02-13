declare module 'color-namer' {
    interface ColorMatch {
        name: string;
        hex: string;
        distance: number;
    }

    interface ColorNamerResult {
        roygbiv: ColorMatch[];
        basic: ColorMatch[];
        html: ColorMatch[];
        x11: ColorMatch[];
        pantone: ColorMatch[];
        ntc: ColorMatch[];
    }

    function colorNamer(color: string, options?: { pick?: string[] }): ColorNamerResult;
    export default colorNamer;
}
