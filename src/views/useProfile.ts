import { ref, readonly } from 'vue';
import { useIonRouter } from '@ionic/vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// --- Estado (Singleton) ---
// Este estado será compartido entre todos los componentes que usen este composable.
const userName = ref('Usuario Forgy');
const userEmail = ref('usuario@forgy.app');

// --- Inicialización ---
// Carga los datos iniciales del usuario desde localStorage para evitar parpadeos en la carga.
try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        userName.value = parsedUser.name || 'Usuario Forgy';
        userEmail.value = parsedUser.email || 'usuario@forgy.app';
    }
} catch (e) {
    console.error("Error al parsear el usuario desde localStorage", e);
    localStorage.removeItem('user'); // Limpia datos corruptos
}

// --- Función Composable ---
export function useProfile() {
    const router = useIonRouter();

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('token_data');
        userName.value = 'Usuario Forgy';
        userEmail.value = 'usuario@forgy.app';
        router.replace('/auth');
    };

    const loadProfileData = async () => {
        try {
            const response = await fetch(`${API_URL}/user/profile`, {
                headers: getHeaders()
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.log('Sesión expirada o inválida. Cerrando sesión.');
                    logout();
                }
                throw new Error('No se pudo obtener los datos del perfil');
            }

            const freshUser = await response.json();

            if (freshUser) {
                userName.value = freshUser.name;
                userEmail.value = freshUser.email;
                localStorage.setItem('user', JSON.stringify(freshUser));
            }
        } catch (error) {
            console.error('Error al obtener datos del perfil desde la API:', error);
            // La carga inicial desde localStorage actúa como respaldo.
        }
    };

    return {
        userName: readonly(userName),
        userEmail: readonly(userEmail),
        loadProfileData,
        logout,
        getHeaders,
        API_URL
    };
}