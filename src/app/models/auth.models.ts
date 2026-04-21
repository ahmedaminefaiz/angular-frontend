export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
    email: string;
    nom: string;
    prenom: string;
    dateNaissance: string;
    ville: string;
    password: string;
}