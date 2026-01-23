export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductDTO {
    name: string;
    description?: string;
    price: number;
}

export interface UpdateProductDTO {
    name?: string;
    description?: string;
    price?: number;
    active?: boolean;
}
