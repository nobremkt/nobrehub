import '@testing-library/jest-dom';

// Mock matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
});

// Mock IntersectionObserver
class IntersectionObserverMock {
    observe = () => null;
    disconnect = () => null;
    unobserve = () => null;
}

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserverMock,
});

// Mock ResizeObserver
class ResizeObserverMock {
    observe = () => null;
    disconnect = () => null;
    unobserve = () => null;
}

Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: ResizeObserverMock,
});
